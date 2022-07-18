const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const Message = new Schema({
  title: { type: String, min: 1, required: true },
  time: { type: Date, default: '' },
  text: { type: String, min: 1, required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  is_pinned: { type: Boolean, default: false },
});

Message.virtual('formatted_date').get(function () {
  return (this.time === null) ? 'Unknown'
    : DateTime.fromJSDate(this.time)
      .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
});

module.exports = mongoose.model('Message', Message);
