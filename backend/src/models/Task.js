const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other'],
      default: 'other',
    },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    dueDate: { type: Date, default: null },
    reminderDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    position: { type: Number, default: 0 },
    subtasks: [
      {
        title: { type: String, required: true, maxlength: 200 },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    comments: [commentSchema],
    isArchived: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'done') return false;
  return new Date() > this.dueDate;
});

taskSchema.virtual('subtaskProgress').get(function () {
  if (!this.subtasks.length) return null;
  const done = this.subtasks.filter((s) => s.completed).length;
  return { done, total: this.subtasks.length, percent: Math.round((done / this.subtasks.length) * 100) };
});

taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, dueDate: 1 });
taskSchema.index({ owner: 1, priority: 1 });
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

taskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  if (this.isModified('status') && this.status !== 'done') {
    this.completedAt = null;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
