const Lang     = imports.lang;
const Gio      = imports.gi.Gio;
const GLib     = imports.gi.GLib;
const St       = imports.gi.St;
const Meta     = imports.gi.Meta;
const Unite    = imports.misc.extensionUtils.getCurrentExtension();
const Signals  = Unite.imports.handlers.SignalsHandler;
const Settings = Unite.imports.handlers.SettingsHandler;

var BaseModule = new Lang.Class({
  Name: 'Unite.BaseModule',

  _enableKey: null,
  _enableValue: null,
  _disableValue: null,

  _onInitialize() {},
  _onActivate() {},
  _onDeactivate() {},
  _onReload() {},
  _onDestroy() {},

  _init() {
    this._signals  = new Signals(this);
    this._settings = new Settings(this);

    this._onInitialize();
    this._activate();

    this._settings.enable(this._enableKey, this._reload);
  },

  _activate() {
    this._enabled = this._settings.get(this._enableKey);

    let enabled = this._enabled == this._enableValue;
    if (this._enableValue != null && !enabled) return;

    let disabled = this._enabled == this._disableValue;
    if (this._disableValue != null && disabled) return;

    this._onActivate();
  },

  _deactivate() {
    this._onDeactivate();

    this._settings.disconnectAll();
    this._signals.disconnectAll();
  },

  _reload() {
    this._deactivate();
    this._activate();
    this._onReload();
  },

  destroy() {
    this._deactivate();
    this._onDestroy();
    this._settings.disable();
  },

  getThemeContext() {
    return St.ThemeContext.get_for_stage(global.stage);
  },

  getTheme() {
    let context = this.getThemeContext();
    return context.get_theme();
  },

  getGioFile(filePath) {
    let absPath = GLib.build_filenamev([Unite.path, filePath]);

    if (GLib.file_test(absPath, GLib.FileTest.EXISTS))
      return Gio.file_new_for_path(absPath);
  },

  loadStylesheet(filePath) {
    let gioFile = this.getGioFile(filePath);
    if (!gioFile) return;

    let theme = this.getTheme();
    theme.load_stylesheet(gioFile);

    return gioFile;
  },

  unloadStylesheet(gioFile) {
    let theme = this.getTheme();
    theme.unload_stylesheet(gioFile);
  },

  scaleSize(initial_size) {
    let context = this.getThemeContext();
    return initial_size * context.scale_factor;
  },

  isValidWindow(win) {
    if (!win) return;

    let meta  = Meta.WindowType;
    let types = [meta.NORMAL, meta.DIALOG, meta.MODAL_DIALOG, meta.UTILITY];

    return types.includes(win.window_type);
  },

  isMaximized(win, match_state) {
    if (!win) return;

    let flags         = Meta.MaximizeFlags;
    let maximized     = win.get_maximized()
    let primaryScreen = win.is_on_primary_monitor();
    let tileMaximized = maximized == flags.HORIZONTAL || maximized == flags.VERTICAL;
    let fullMaximized = maximized == flags.BOTH;
    let bothMaximized = fullMaximized || tileMaximized;

    switch (match_state) {
      case 'both':      return primaryScreen && bothMaximized;
      case 'maximized': return primaryScreen && fullMaximized;
      case 'tiled':     return primaryScreen && tileMaximized;
    }
  }
});
