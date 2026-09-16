export const EQUIPMENT_TYPES = ['Tractor', 'Rotavator', 'Harvester', 'Seeder', 'Sprayer', 'Thresher', 'Cultivator', 'Other'];
export const EQUIPMENT_CONDITIONS = ['Good', 'Very Good', 'Excellent'];

export function getEquipmentModel(connection) {
  if (connection.models.Equipment) return connection.models.Equipment;
  const { Schema } = connection.base;
  const schema = new Schema({
    _id: { type: String, required: true },
    ownerId: { type: String, required: true, index: true, trim: true },
    ownerName: { type: String, required: true, trim: true, maxlength: 80 },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, required: true, enum: EQUIPMENT_TYPES, index: true },
    description: { type: String, default: '', trim: true, maxlength: 600 },
    district: { type: String, required: true, trim: true, maxlength: 80, index: true },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    dailyRate: { type: Number, required: true, min: 1, max: 100000 },
    securityDeposit: { type: Number, default: 0, min: 0, max: 500000 },
    condition: { type: String, required: true, enum: EQUIPMENT_CONDITIONS },
    horsepower: { type: Number, default: null, min: 1, max: 1000 },
    availability: {
      from: { type: Date, required: true },
      to: { type: Date, required: true }
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    source: { type: String, enum: ['user', 'demo'], default: 'user' }
  }, {
    timestamps: true,
    collection: 'equipment_listings',
    versionKey: false
  });

  schema.index({ status: 1, type: 1, district: 1, dailyRate: 1 });
  schema.index({ ownerId: 1, status: 1 });
  schema.index({ 'availability.from': 1, 'availability.to': 1 });

  return connection.model('Equipment', schema);
}
