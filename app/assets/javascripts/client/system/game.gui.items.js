/**
 * User: marco
 * Date: 17/02/12
 * Time: 11.39
 */

// The key (container) here is an ID dom selector. A gui div key-gui will be created inside that container (ex: #play-gui)
Game.GuiItems = {
  '.desk': [
    {
      'SystemMenu': {x: 446, y: 20}
    },
//    {
//      'FooterOverflow': {anchor: {custom: 'footer-overflow'}}
//    },
    {
      'Presence': { anchor: {custom: 'presence-panel-view'}}
    },
    {
      'PresenceChats': { anchor: {custom: 'presence-chats'}}
    }
  ],
  '#play': [ // all these items will be put in #play container
    {
      'Players': {x: 0, y: 74}
    },
    {
      'ResearchButtons': {x: 673, y: 56}
    },
    {
      'Resources': {x: 679, y: 164}
    },
    {
      'Chat': {x: 377, y: 10, anchor: {y: 'bottom'}, state: 'play',
        filters: {in: ['StripScripts'], out: ['StripScripts', 'Tokenizer', 'Command']},
        commands:['Konsole', 'Sniff', 'PlacerTracer', 'Mixer', 'Quit', 'EcoMode', 'System', 'Admin']
      }
    },
    {
      'Info': {x: 0, y: 0, anchor: {custom: 'game-info'}}
    },
    {
      'PlayControlPanel': {anchor: {custom: 'play-control-panel'}}
    },
    {
      'BuildButtons': {x: 0, y: 495}
    },
    {
      'Marketplace': {x: 0, y: 652}
    },
    {
      'SummaryCover': {anchor: {custom: 'summary-cover'} } // for modal summary
    },
    {
      'Summary': {anchor: {custom: 'summary'} }
    }
  ],
  '#list': [ // all these items will be put in #list container
    {
      'ListControlPanel': {anchor: {custom: 'list-control-panel'}}
    },
    {
      'GameList': {anchor: {custom: 'game-list'}}
    }
  ],
  '#hiscores': [ // all these items will be put in #hiscores container
    {
      'HiscoresControlPanel': {anchor: {custom: 'hiscores-control-panel'}}
    },
    {
      'HiscoresList': {anchor: {custom: 'hiscores-list'}}
    }
  ],
  '#account': [ // all these items will be put in #hiscores container
    {
      'AccountControlPanel': {anchor: {custom: 'account-control-panel'}}
    },
    {
      'AccountForm': {anchor: {custom: 'account-form'}}
    }
  ]
};

var $guiItems = Game.GuiItems;