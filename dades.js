// Llistes i constants compartides. Aquest fitxer es pot substituir sencer
// sense por: no conté res propi de la vostra instal·lació.
// (Les vostres dues línies viuen al config.js i no s'han de tocar mai des d'aquí.)

// Opcions especials del desplegable de partida (formulari de compra).
const PARTIDA_SENSE = "No correspon a cap partida";
const PARTIDA_ESPECIAL = "Cas especial - contactar amb el responsable";

const TIPUS_FACTURA = [
  "Factura completa (vàlida per a subvencions)",
  "Factura incompleta (no vàlida)",
  "Sense factura"
];

const METODES_PAGAMENT = [
  "Targeta de crèdit",
  "Transferència",
  "Efectiu",
  "Bizum",
  "Avançament personal",
  "Altres"
];

// Reserva: només s'usa si encara no es pot llegir el full «Pressupost».
// La llista bona és la del full, no aquesta.
const DEPARTAMENTS = {
  "AD Administratius": [
    "Logística", "Màrqueting", "Patrocinadors", "Subvencions", "Tresoreria"
  ],
  "DI Dietes": ["General"],
  "EL Elèctric": ["Bateria", "Electrònica", "GE General - EL", "Powertrain"],
  "GA Gasolina": ["General"],
  "GE General": ["GE General - EL", "GE General - ME", "General"],
  "ME Mecànica": [
    "Aerodinàmica", "Xassís", "GE General - ME", "General", "Powertrain",
    "Refrigeració", "Transmissió", "Tren davanter",
    "Tren davanter i/o del darrere", "Tren del darrere"
  ],
  "RE Refrigeració": ["General"]
};
