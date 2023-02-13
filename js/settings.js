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
})
};
