export function getEquipmentRentalModel(connection) {
  if (connection.models.EquipmentRental) return connection.models.EquipmentRental;
  const { Schema } = connection.base;
  const schema = new Schema({
    _id: { type: String, required: true },
    equipmentId: { type: String, required: true, index: true },
    equipmentName: { type: String, required: true, trim: true, maxlength: 100 },
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, required: true, trim: true, maxlength: 80 },
    renterId: { type: String, required: true, index: true },
    renterName: { type: String, required: true, trim: true, maxlength: 80 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    days: { type: Number, required: true, min: 1, max: 90 },
    dailyRateSnapshot: { type: Number, required: true, min: 1 },
    securityDepositSnapshot: { type: Number, default: 0, min: 0 },
    totalRent: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'requested',
      index: true
    }
  }, {
    timestamps: true,
    collection: 'equipment_rentals',
    versionKey: false
  });

  schema.index({ equipmentId: 1, startDate: 1, endDate: 1, status: 1 });
  schema.index({ renterId: 1, createdAt: -1 });
  schema.index({ ownerId: 1, createdAt: -1 });

  return connection.model('EquipmentRental', schema);
}
