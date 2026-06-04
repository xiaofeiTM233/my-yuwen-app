import mongoose from 'mongoose';

// 文言文模型
const PronunciationSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  pinyin: { type: String, required: true },
  note: { type: String },
}, { _id: false });

const TranslationSchema = new mongoose.Schema({
  content: { type: String, required: true },
  types: [{ type: String }],
  start: { type: Number },
  end: { type: Number },
  note: { type: String },
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  origin: { type: String },
  translations: [TranslationSchema],
  pronunciations: [PronunciationSchema],
}, { _id: false });

const WenyanwenSchema = new mongoose.Schema({
  meta: {
    author: { type: String, required: true },
    title: { type: String, required: true },
    book: { type: String, required: true },
  },
  contents: [ContentSchema],
}, { timestamps: true });

export const Wenyanwen = mongoose.models.Wenyanwen || mongoose.model('Wenyanwen', WenyanwenSchema);
