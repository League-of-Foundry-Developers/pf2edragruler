export function registerSettings() {
	// Create the setting for Automatic Movement switching for later use.
	game.settings.register("pf2e-dragruler", "auto", {
		name: "Automatic Movement Switching",
		hint: "If enabled, positive elevations will automatically use fly speed, negative elevations will use burrow, and tokens in water or aquatic terrain will use swim speeds, if an actor does not have that speed, it will instead use their land speed.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
}),
game.settings.register("pf2e-dragruler", "scene", {
	name: "Scene Environment Automation",
	hint: "Requires Enhanced Terrain Layer. If enabled, actors in Sky scenes will automatically use fly speed, and those in aquatic terrain will use swim speeds, if an actor does not have a speed, will use their land speed.",
	scope: "world",
	config: true,
	type: Boolean,
	default: false
}),
game.settings.register("pf2e-dragruler", "offTurnMovement", {
	name: "Ignore Off Turn Movement",
	hint: "Requires movement history to be enabled. Automatically resets movement history at the start of each actor's turn in combat, meaning any movement performed off turn as a reaction won't effect the movement history, on your turn.",
	scope: "world",
	config: true,
	type: Boolean,
	default: false
}),
game.settings.register("pf2e-dragruler", "partialMovements", {
	name: "Partial Movements",
	hint: "Treat each completed drag as an action, and reduce viable move distance as appropriate",
	scope: "world",
	config: true,
	type: Boolean,
	default: false
})
};
