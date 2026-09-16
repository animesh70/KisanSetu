import test from 'node:test';
import assert from 'node:assert/strict';
import { resetEquipmentDemoData } from '../repositories/equipmentRepository.js';

function fakeModel(initial = []) {
  let docs = structuredClone(initial);
  return {
    async countDocuments() { return docs.length; },
    async deleteMany() { docs = []; return { acknowledged: true }; },
    async insertMany(items) { docs.push(...structuredClone(items)); return items; },
    values() { return structuredClone(docs); }
  };
}

test('Reset demo clears rental activity and restores the three starter equipment listings', async () => {
  const previous = process.env.EQUIPMENT_DEMO_SEED_ENABLED;
  process.env.EQUIPMENT_DEMO_SEED_ENABLED = 'true';
  try {
    const Equipment = fakeModel([{ _id: 'equipment-user-created' }]);
    const Rental = fakeModel([{ _id: 'rental-old' }, { _id: 'rental-old-2' }]);

    const result = await resetEquipmentDemoData({ Equipment, Rental });

    assert.deepEqual(result, { equipmentCount: 3, rentalCount: 0 });
    assert.deepEqual(
      Equipment.values().map((item) => item._id).sort(),
      ['equipment-demo-rotavator', 'equipment-demo-sprayer', 'equipment-demo-tractor']
    );
    assert.equal(Rental.values().length, 0);
  } finally {
    if (previous === undefined) delete process.env.EQUIPMENT_DEMO_SEED_ENABLED;
    else process.env.EQUIPMENT_DEMO_SEED_ENABLED = previous;
  }
});

test('Reset demo can clear equipment without reseeding when demo seed is disabled', async () => {
  const previous = process.env.EQUIPMENT_DEMO_SEED_ENABLED;
  process.env.EQUIPMENT_DEMO_SEED_ENABLED = 'false';
  try {
    const Equipment = fakeModel([{ _id: 'equipment-user-created' }]);
    const Rental = fakeModel([{ _id: 'rental-old' }]);

    const result = await resetEquipmentDemoData({ Equipment, Rental });

    assert.deepEqual(result, { equipmentCount: 0, rentalCount: 0 });
    assert.equal(Equipment.values().length, 0);
    assert.equal(Rental.values().length, 0);
  } finally {
    if (previous === undefined) delete process.env.EQUIPMENT_DEMO_SEED_ENABLED;
    else process.env.EQUIPMENT_DEMO_SEED_ENABLED = previous;
  }
});
