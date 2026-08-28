// ---------------------------------------------------------------------------
// Configuració. Aquests dos valors els has d'omplir tu.
// ---------------------------------------------------------------------------

// Client ID d'OAuth que has creat a Google Cloud.
const CLIENT_ID = "1045027365645-f719r5b11t4ooupfn249arbmjodumsd0.apps.googleusercontent.com";

// URL del desplegament de l'Apps Script (acaba amb /exec).
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxm71O3S5MomussP3OaxC7ozSBfjMqM8Vo5GMwsxUmVSZrtDId6VihHEECJM_-md9ofAQ/exec";

// ---------------------------------------------------------------------------
// Departaments i subdepartaments. Editar aquí ho canvia a tots els formularis.
// ---------------------------------------------------------------------------

const DEPARTAMENTS = {
  "AD Administratius": [
    "Logística",
    "Màrqueting",
    "Patrocinadors",
    "Subvencions",
    "Tresoreria"
  ],
  "DI Dietes": [
    "General"
  ],
  "EL Elèctric": [
    "Bateria",
    "Electrònica",
    "GE General - EL",
    "Powertrain"
  ],
  "GA Gasolina": [
    "General"
  ],
  "GE General": [
    "GE General - EL",
    "GE General - ME",
    "General"
  ],
  "ME Mecànica": [
    "Aerodinàmica",
    "Xassís",
    "GE General - ME",
    "General",
    "Powertrain",
    "Refrigeració",
    "Transmissió",
    "Tren davanter",
    "Tren davanter i/o del darrere",
    "Tren del darrere"
  ],
  "RE Refrigeració": [
    "General"
  ]
};

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
