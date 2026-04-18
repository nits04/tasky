const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
  }
  next();
};

const taskOwnerOrCollab = async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ status: 'error', message: 'Task not found.' });

  const userId = req.user._id.toString();
  const isOwner = task.owner.toString() === userId;
  const isCollab = task.collaborators.some((c) => c.toString() === userId);

  if (!isOwner && !isCollab) {
    return res.status(403).json({ status: 'error', message: 'Access denied.' });
  }

  req.task = task;
  next();
};

// ── GET /tasks — list with filtering, sorting, search, pagination ──────────
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      priority,
      category,
      search,
      dueDate,
      tags,
      page = 1,
      limit = 50,
      sort = '-createdAt',
      archived = 'false',
    } = req.query;

    const filter = {
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
      isArchived: archived === 'true',
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (dueDate) {
      const date = new Date(dueDate);
      filter.dueDate = { $lte: new Date(date.setHours(23, 59, 59, 999)) };
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('owner', 'name avatar email')
        .populate('assignedTo', 'name avatar email')
        .populate('collaborators', 'name avatar email')
        .populate('comments.user', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /tasks/stats ────────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userFilter = { $or: [{ owner: userId }, { collaborators: userId }], isArchived: false };

    const [byStatus, byPriority, byCategory, overdue] = await Promise.all([
      Task.aggregate([
        { $match: userFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: userFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: userFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        ...userFilter,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
    ]);

    res.json({
      status: 'success',
      data: { byStatus, byPriority, byCategory, overdue },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /tasks ─────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('category').optional().isIn(['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date'),
    body('reminderDate').optional({ nullable: true }).isISO8601().withMessage('Invalid reminder date'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const task = await Task.create({ ...req.body, owner: req.user._id });
      await task.populate('owner', 'name avatar email');

      // Emit real-time event
      req.app.get('io')?.to(req.user._id.toString()).emit('task:created', task);

      res.status(201).json({ status: 'success', data: { task } });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /tasks/:id ──────────────────────────────────────────────────────────
router.get('/:id', taskOwnerOrCollab, async (req, res) => {
  await req.task.populate([
    { path: 'owner', select: 'name avatar email' },
    { path: 'assignedTo', select: 'name avatar email' },
    { path: 'collaborators', select: 'name avatar email' },
    { path: 'comments.user', select: 'name avatar' },
  ]);
  res.json({ status: 'success', data: { task: req.task } });
});

// ── PATCH /tasks/:id ────────────────────────────────────────────────────────
router.patch(
  '/:id',
  taskOwnerOrCollab,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('category').optional().isIn(['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const forbidden = ['owner', 'comments', 'attachments'];
      forbidden.forEach((f) => delete req.body[f]);

      Object.assign(req.task, req.body);
      await req.task.save();
      await req.task.populate([
        { path: 'owner', select: 'name avatar email' },
        { path: 'assignedTo', select: 'name avatar email' },
        { path: 'collaborators', select: 'name avatar email' },
      ]);

      // Broadcast update to all collaborators
      const io = req.app.get('io');
      if (io) {
        const roomIds = [req.task.owner._id.toString(), ...req.task.collaborators.map((c) => c._id.toString())];
        roomIds.forEach((id) => io.to(id).emit('task:updated', req.task));
      }

      res.json({ status: 'success', data: { task: req.task } });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /tasks/:id ───────────────────────────────────────────────────────
router.delete('/:id', taskOwnerOrCollab, async (req, res, next) => {
  try {
    if (req.task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Only the owner can delete this task.' });
    }

    await req.task.deleteOne();

    req.app.get('io')?.to(req.user._id.toString()).emit('task:deleted', { id: req.params.id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── POST /tasks/:id/comments ────────────────────────────────────────────────
router.post(
  '/:id/comments',
  taskOwnerOrCollab,
  [body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 })],
  validate,
  async (req, res, next) => {
    try {
      req.task.comments.push({ user: req.user._id, text: req.body.text });
      await req.task.save();
      await req.task.populate('comments.user', 'name avatar');

      const newComment = req.task.comments[req.task.comments.length - 1];

      const io = req.app.get('io');
      if (io) {
        const roomIds = [req.task.owner.toString(), ...req.task.collaborators.map((c) => c.toString())];
        roomIds.forEach((id) => io.to(id).emit('task:comment', { taskId: req.task._id, comment: newComment }));
      }

      res.status(201).json({ status: 'success', data: { comment: newComment } });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /tasks/:id/subtasks/:subtaskId ────────────────────────────────────
router.patch('/:id/subtasks/:subtaskId', taskOwnerOrCollab, async (req, res, next) => {
  try {
    const subtask = req.task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ status: 'error', message: 'Subtask not found.' });

    subtask.completed = req.body.completed ?? !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;
    await req.task.save();

    res.json({ status: 'success', data: { task: req.task } });
  } catch (err) {
    next(err);
  }
});

// ── POST /tasks/reorder — Kanban drag-and-drop ──────────────────────────────
router.post('/reorder', async (req, res, next) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ status: 'error', message: 'updates must be an array.' });
    }

    await Promise.all(
      updates.map(({ id, status, position }) =>
        Task.findOneAndUpdate(
          { _id: id, $or: [{ owner: req.user._id }, { collaborators: req.user._id }] },
          { status, position }
        )
      )
    );

    req.app.get('io')?.to(req.user._id.toString()).emit('task:reordered', updates);
    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /tasks/:id/archive ────────────────────────────────────────────────
router.patch('/:id/archive', taskOwnerOrCollab, async (req, res, next) => {
  try {
    req.task.isArchived = !req.task.isArchived;
    await req.task.save();
    res.json({ status: 'success', data: { task: req.task } });
  } catch (err) {
    next(err);
  }
});

// ── GET /tasks/notifications — user notifications ───────────────────────────
router.get('/user/notifications', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ status: 'success', data: { notifications: user.notifications } });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /tasks/user/notifications/read ────────────────────────────────────
router.patch('/user/notifications/read', async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'notifications.$[].read': true } });
    res.json({ status: 'success', message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
