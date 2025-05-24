const mongoose = require('mongoose');

const KycSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true, // One KYC per company
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resubmission_required'],
    default: 'pending',
  },

  submitted_at: {
    type: Date,
  },

  verified_at: {
    type: Date,
  },

  rejected_reason: {
    type: String,
  },

  verified_by_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  documents: {
    gst: {
      url: { type: String },
      uploaded_at: { type: Date },
    },
    pan: {
      url: { type: String },
      uploaded_at: { type: Date },
    },
    license: {
      url: { type: String },
      uploaded_at: { type: Date },
    }
  },
  created_at:{
    type:Number
  },
  updated_at:{
    type:Number
  }
});

module.exports = mongoose.model('Kyc', KycSchema);
