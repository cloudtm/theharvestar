Game.Animations = {
  terrain: {
    /******************************************************************************/
    // ENERGY => lava tiles
    cyclon0: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 0, fps: 8, next: null,
          seq: [0]
        }
      }
    },
    cyclon1: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -3, y: -26}, cycles: "5..10", fps: 8, next: "animate",
          seq: [0,1,2,3,4,5,6,7]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -3, y: -26}, cycles: 1, fps: 10, next: "idle",
          seq: [8,9,10,11,12,13,14,15,16,17,18,19,20,21]
        }
      }
    },
    cyclon2: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -2, y: -17}, cycles: "5..10", fps: 8, next: "animate",
          seq: [0,1,2,3,4,5,6,7]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -2, y: -17}, cycles: 1, fps: 10, next: "idle",
          seq: [8,9,10,11,12,13,14,15,16,17,18,19,20,21]
        }
      }
    },
    cyclon3: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -23}, cycles: "5..10", fps: 8, next: "animate",
          seq: [0,1,2,3,4,5,6,7]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -23}, cycles: 1, fps: 10, next: "idle",
          seq: [8,9,10,11,12,13,14,15,16,17,18,19,20,21]
        }
      }
    },
    cyclon4: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -25}, cycles: "5..10", fps: 8, next: "animate",
          seq: [0,1,2,3,4,5,6,7]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -25}, cycles: 1, fps: 10, next: "idle",
          seq: [8,9,10,11,12,13,14,15,16,17,18,19]
        }
      }
    },
    /******************************************************************************/
    // SILICON
    volcano0: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14]
        }
      }
    },
    volcano1: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: "2..7", fps: 8, next: "animate",
          seq: [0,1,2,3,4]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 1, fps: 15, next: "idle",
          seq: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
        }
      }
    },
    volcano2: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -2, y: -17}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -2, y: -17}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14]
        }
      }
    },
    volcano3: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -2, y: -23}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -2, y: -23}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
        }
      }
    },
    volcano4: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -18}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -18}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37]
        }
      }
    },
    /******************************************************************************/
    // TITANIUM
    mountain0: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27]
        }
      }
    },
    mountain1: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -17}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -17}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13]
        }
      }
    },
    mountain2: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
        }
      }
    },
    mountain3: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]
        }
      }
    },
    mountain4: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -4, y: -2}, cycles: "3..10", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -4, y: -2}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
        }
      }
    },
    /******************************************************************************/
    // FOOD
    field0: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -3, y: -17}, cycles: "1..5", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -3, y: -17}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9]
        }
      }
    },
    field1: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -3, y: -17}, cycles: "1..5", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -3, y: -17}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9]
        }
      }
    },
    field2: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: "2..5", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10]
        }
      }
    },
    field3: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: "3..6", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -11}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
        }
      }
    },
    field4: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -15}, cycles: "1..6", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -15}, cycles: 1, fps: 15, next: "idle",
          seq: [1,2,3,4,5,6,7,8,9]
        }
      }
    },
    /******************************************************************************/
    // WATER
    lake0: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -5, y: -19}, cycles: -1, fps: 15, next: null,
          seq: [0,1,2,3,4]
        }
      }
    },
    lake1: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -1, y: -29}, cycles: -1, fps: 15, next: null,
          seq: [0,1,2,3,4]
        }
      }
    },
    lake2: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -19}, cycles: -1, fps: 15, next: null,
          seq: [0,1,2,3,4]
        }
      }
    },
    lake3: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: 0, y: -23}, cycles: -1, fps: 15, next: null,
          seq: [0,1,2,3,4]
        }
      }
    },
    lake4: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 128}, pos: {x:0, y:0}, offset: {x: -2, y: -27}, cycles: -1, fps: 15, next: null,
          seq: [0,1,2,3,4]
        }
      }
    },
    /******************************************************************************/
    // DESERT
    desert5: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 100, h: 160}, pos: {x:0, y:0}, offset: {x: 0, y: -46}, cycles: 0, fps: 8, next: null,
          seq: [0]
        },        
        active: {
          frame: {w: 100, h: 160}, pos: {x:0, y:0}, offset: {x: 0, y: -46}, cycles: "4..7", fps: 1, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 100, h: 160}, pos: {x:0, y:0}, offset: {x: 0, y: -46}, cycles: 1, fps: 15, next: "active",
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]
        }
      }
    },
    /******************************************************************************/
    // DESERT
    raiders: {
      start: "idle", stripes: {
        idle: {
          frame: {w: 29, h: 35}, pos: {x:0, y:0}, offset: {x: 0, y: -35}, cycles: 0, next: null,
          seq: [0]
        },
        move: {
          frame: {w: 29, h: 35}, pos: {x:0, y:0}, offset: {x: 0, y: -35}, cycles: 1, fps: 0.5, next: "animate",
          seq: [0]
        },
        animate: {
          frame: {w: 29, h: 78}, pos: {x:0, y:0}, offset: {x: 0, y: -35}, cycles: -1, fps: 10, next: null,
          seq: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
        }
      }
    },
    /******************************************************************************/
    // EXPLOSION
    production: {
      normal: {
        start: "idle", stripes: {
          idle: {
            frame: {w: 62, h: 62}, pos: {x:0, y:0}, offset: {x: 0, y: 0}, cycles: 0, next: null,
            seq: [-1] // adjusted in animationLoaded
          }
        }
      },
      explode: {
        start: "idle", stripes: {
          idle: {
            frame: {w: 62, h: 62}, pos: {x:0, y:0}, offset: {x: 0, y: 0}, cycles: 1, fps: 2, next: "explode",
            seq: [-1] // adjusted in animationLoaded
          },
          explode: {
            frame: {w: 60, h: 67}, pos: {x:0, y:62}, offset: {x: 0, y: 0}, cycles: 1, fps: 15, next: null,
            seq: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]
          }
        }
      }      
    }

  }
}
var $animation = Game.Animations;