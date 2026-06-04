const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    badge:    { type: String, required: true, trim: true },
    color:    { type: String, enum: ['r','y','b','o'], default: 'r' },
    date:     { type: String, required: true, trim: true },
    name:     { type: String, required: true, trim: true },
    nameTh:   { type: String, default: '', trim: true },
    tag:      { type: String, enum: ['jam','live','open','other'], default: 'jam' },
    tagLabel:    { type: String, required: true, trim: true },
    imageUrl:    { type: String, default: '', trim: true },
    imageFocus:  { type: String, default: 'center', trim: true },
    description: { type: String, default: '', trim: true },
    active:      { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
