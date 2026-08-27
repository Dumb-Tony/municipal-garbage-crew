(function exposeMunicipalGarbageContracts(root, factory) {
  const contracts = factory();
  if (typeof module === "object" && module.exports) module.exports = contracts;
  else root.MGCContracts = contracts;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMunicipalGarbageContracts() {
  "use strict";

  function freezeItems(items) {
    return Object.freeze(items.map(item => Object.freeze({ ...item })));
  }

  const CONTRACTS = Object.freeze({
    regular: Object.freeze({
      id: "regular", name: "Maple Regular", stamp: "FORM 04-A // REGULAR COLLECTION",
      description: "The balanced ten-stop route used for comparable crew evaluations.",
      extraSeconds: 0, payoutMultiplier: 1, binWeightMultiplier: 1, trafficSpeedMultiplier: 1, seedOffset: 0,
      extraWaste: freezeItems([]), initialSpills: freezeItems([])
    }),
    bulk: Object.freeze({
      id: "bulk", name: "Bulk Amnesty", stamp: "FORM 19-C // CURBSIDE AMNESTY",
      description: "Two extra oversized pickups and heavier carts. More compactor planning, ninety extra seconds.",
      extraSeconds: 90, payoutMultiplier: 1.2, binWeightMultiplier: 1.08, trafficSpeedMultiplier: .95, seedOffset: 17011,
      extraWaste: freezeItems([
        { id: "sofa-bellwether", stopId: 8, x: 1760, y: 402, type: "bulk", label: "BROKEN SOFA", weight: 1.7, fragile: false },
        { id: "radiator-east", stopId: 10, x: 2572, y: 407, type: "bulk", label: "CAST-IRON RADIATOR", weight: 1.25, fragile: false }
      ]),
      initialSpills: freezeItems([])
    }),
    storm: Object.freeze({
      id: "storm", name: "After-Storm Sweep", stamp: "FORM 31-S // STREET RESTORATION",
      description: "Three assigned debris fields share the route with regular collection. Slower traffic, sixty extra seconds.",
      extraSeconds: 60, payoutMultiplier: 1.15, binWeightMultiplier: 1, trafficSpeedMultiplier: .84, seedOffset: 29021,
      extraWaste: freezeItems([]),
      initialSpills: freezeItems([
        { id: "storm-west", x: 690, y: 316, job: true },
        { id: "storm-crossing", x: 1570, y: 354, job: true },
        { id: "storm-east", x: 2290, y: 286, job: true }
      ])
    })
  });
  const CONTRACT_ORDER = Object.freeze(["regular", "bulk", "storm"]);

  function getContract(id) {
    return CONTRACTS[id] || CONTRACTS.regular;
  }

  function prepareStops(baseStops, contractId) {
    const contract = getContract(contractId);
    return baseStops.map(stop => ({ ...stop, weight: Number((stop.weight * contract.binWeightMultiplier).toFixed(2)) }));
  }

  function prepareWaste(baseWaste, contractId) {
    const contract = getContract(contractId);
    return [...baseWaste, ...contract.extraWaste].map(item => ({ ...item }));
  }

  function prepareTraffic(baseTraffic, contractId) {
    const multiplier = getContract(contractId).trafficSpeedMultiplier;
    return baseTraffic.map(vehicle => ({ ...vehicle, ...(vehicle.vx == null ? {} : { vx: vehicle.vx * multiplier }), ...(vehicle.vy == null ? {} : { vy: vehicle.vy * multiplier }) }));
  }

  function prepareSpills(contractId) {
    return getContract(contractId).initialSpills.map(spill => ({ ...spill, cleaned: false }));
  }

  return Object.freeze({ CONTRACTS, CONTRACT_ORDER, getContract, prepareStops, prepareWaste, prepareTraffic, prepareSpills });
});
