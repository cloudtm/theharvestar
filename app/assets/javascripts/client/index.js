/**
 * Created with JetBrains RubyMine.
 * User: marco
 * Date: 25/07/12
 * Time: 18.36
 * To change this template use File | Settings | File Templates.
 */

/********************* Core ***********************/
//= require ./core/core
//= require ./core/core.logger
//= require ./core/core.actors
//= require ./core/core.templates
//= require ./core/core.mainframe
//= require ./core/core.module.draganddrop
//= require ./core/core.konsole.panel
//= require ./core/core.dispatcher
//= require ./core/core.transitions
//= require ./core/core.fsm
//= require ./core/core.ajax
//= require ./core/jquery.forwardMouseEvents

/******************** Game systems ***********************/
//= require ./system/game.namespace
//= require ./system/game.settings
//= require ./system/game.messages
//= require ./system/game.animations
//= require ./system/game.gui.items
//= require ./system/game.sniffer
//= require ./system/game.sound
//= require ./system/game.controller
//= require ./system/game.history
//= require ./system/game.presence

/******************** Communication ***********************/
//= require ./comm/game.strategies
//= require ./comm/game.strategies.list
//= require ./comm/game.strategies.play
//= require ./comm/game.rpc
//= require ./comm/game.versioning
//= require ./comm/madmass.socky
//= require ./comm/pusher.socket

/********************* Map classes ***********************/
//= require ./map/game.map
//= require ./map/layers/game.map.layer.title
//= require ./map/layers/game.map.layer.score
//= require ./map/layers/game.map.layer.grid
//= require ./map/layers/game.map.layer.links
//= require ./map/layers/game.map.layer.isometry
//= require ./map/layers/game.map.layer.input
//= require ./map/game.map.terrains
//= require ./map/game.map.raiders
//= require ./map/game.map.structures

/********************* Gui classes ************************/
//= require ./gui/game.gui
//= require ./gui/game.gui.components
//= require ./gui/game.gui.popup
//= require ./gui/game.gui.chat.js
//= require ./gui/game.gui.chat.filters.js
//= require ./gui/game.gui.chat.commands.js

/******************* Desk gui items ***********************/
//= require ./gui/desk/game.gui.systemenu
//= require ./gui/desk/game.gui.settings
//  require ./gui/desk/game.gui.footer.overflow
//= require ./gui/desk/game.gui.presence
//= require ./gui/desk/game.gui.presence.chats
//= require ./gui/desk/game.gui.presence.chat.js

/******************* List gui items ***********************/
//= require ./gui/list/game.gui.list.control
//= require ./gui/list/game.gui.game.list
//= require ./gui/list/game.gui.game.entry

/***************** Hiscores gui items *********************/
//= require ./gui/hiscores/game.gui.hiscores.control
//= require ./gui/hiscores/game.gui.hiscores.list
//= require ./gui/hiscores/game.gui.hiscores.entry


/***************** Account gui items **********************/
//= require ./gui/account/game.gui.account.control
//= require ./gui/account/game.gui.account.form

/****************** Play gui items ************************/
//= require ./gui/play/game.gui.build
//= require ./gui/play/game.gui.research
//= require ./gui/play/game.gui.market
//= require ./gui/play/game.gui.market.dialog
//= require ./gui/play/game.gui.market.entry
//= require ./gui/play/game.gui.raiders.dialog
//= require ./gui/play/game.gui.info
//= require ./gui/play/game.gui.resources
//= require ./gui/play/game.gui.players
//= require ./gui/play/game.gui.summary
//= require ./gui/play/game.gui.play.control

//= require ./game.config
//= require ./game.helpers
//= require ./game.main

/************** Now initialization code *******************/
//= require ./initialization