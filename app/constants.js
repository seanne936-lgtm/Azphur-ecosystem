// Dati di test per la Fase 1 di Azphur
export const STATIONS = [
  {
    id: "ST-001",
    name: "Manila Central Hub",
    address: "Quezon City, Manila",
    status: "active",
    chargers: [
      { id: "CH-1", type: "DC Fast", power: "50kW", price: 15, status: "available" },
      { id: "CH-2", type: "AC Standard", power: "7kW", price: 10, status: "charging" }
    ]
  },
  {
    id: "ST-002",
    name: "Cebu South Station",
    address: "South Road, Cebu City",
    status: "active",
    chargers: [
      { id: "CH-3", type: "DC Super", power: "120kW", price: 25, status: "available" }
    ]
  }
];

// Logica delle commissioni (dal PDF di tuo fratello)
export const COMMISSIONS = {
  platform_rate: 0.10,      // Il 10% che va a Azphur
  gateway_fee_fixed: 10     // Costo fisso della banca/gateway (es. PayMongo)
};