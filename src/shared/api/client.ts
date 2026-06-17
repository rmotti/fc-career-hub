// Public API surface — a barrel that re-exports the shared HTTP core and every
// resource module. Import from here (`@/shared/api/client`); the split into
// `./http` + `./modules/*` is an internal organization detail. Each module owns
// its own request types and its `xxxApi` object.

export * from "./http";
export * from "./modules/auth";
export * from "./modules/saves";
export * from "./modules/club-stints";
export * from "./modules/players";
export * from "./modules/fc26-players";
export * from "./modules/clubs";
export * from "./modules/competitions";
export * from "./modules/team-stats";
export * from "./modules/transfers";
export * from "./modules/trophies";
export * from "./modules/scout";
export * from "./modules/chat";
