/*

JS GameBoy Emulator v.1.0
Copyright (C) 2013 Alejandro Aladrén <alex@alexaladren.net> 

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */

var GameBoy = function(rom) {
  var _this = this;

  this.COLOR0 = (255 << 24) | (255 << 16) | (255 << 8) | 255;
  this.COLOR1 = (255 << 24) | (204 << 16) | (204 << 8) | 204;
  this.COLOR2 = (255 << 24) | (153 << 16) | (153 << 8) | 153;
  this.COLOR3 = (255 << 24) | (0 << 16) | (0 << 8) | 0;

  this.displaycanvas = null;
  this.onFPS = null;

  var rommap = new Uint8Array(rom);
  this.rom8bit = new Array(rommap.length);
  for (var i = 0; i < rommap.length; i++) {
    this.rom8bit[i] = rommap[i];
  }

  this.romBanks = 2 * Math.pow(2, this.rom8bit[0x0148]);
  this.activeRomBank = 1;

  switch (this.rom8bit[0x0149]) {
    case 0:
      this.ramSpace = 0;
      this.ramBanks = 0;
      break;
    case 1:
      this.ramSpace = 2048;
      this.ramBanks = 1;
      break;
    case 2:
      this.ramSpace = 8192;
      this.ramBanks = 1;
      break;
    case 3:
      this.ramSpace = 32768;
      this.ramBanks = 4;
      break;
    default:
      this.ramSpace = 0;
  }
  this.activeRamBank = 0;
  this.ramEnabled = 0;

  this.romRamMode = 0; // 0 = ROM mode, 1 = RAM mode

  this.cartram8bit = new Array(this.ramSpace);
  this.vram8bit = new Array(8192);
  this.wram8bit = new Array(8192);
  this.spriteram8bit = new Array(160);
  this.io8bit = new Array(127);
  this.hram8bit = new Array(126);

  this.bgMap = new Array();
  this.bgModified = new Array();
  for (var i = 0; i < 32; i++) {
    this.bgMap[i] = new Array();
    this.bgModified[i] = new Array();
    for (var j = 0; j < 32; j++) {
      this.bgMap[i][j] = -1;
      this.bgModified[i][j] = new Date();
    }
  }

  this.bgCanvas = document.createElement('canvas');
  this.bgCanvas.width = 256;
  this.bgCanvas.height = 256;
  this.bgCtx = this.bgCanvas.getContext('2d');

  this.winMap = new Array();
  this.winModified = new Array();
  for (var i = 0; i < 32; i++) {
    this.winMap[i] = new Array();
    this.winModified[i] = new Array();
    for (var j = 0; j < 32; j++) {
      this.winMap[i][j] = -1;
      this.winModified[i][j] = new Date();
    }
  }

  this.winCanvas = document.createElement('canvas');
  this.winCanvas.width = 256;
  this.winCanvas.height = 256;
  this.winCtx = this.winCanvas.getContext('2d');

  this.spriteMap = new Array();
  this.spriteCanvas = new Array();
  this.spriteCtx = new Array();
  for (var i = 0; i < 40; i++) {
    this.spriteMap[i] = -1;
    this.spriteCanvas[i] = document.createElement('canvas');
    this.spriteCanvas[i].width = 8;
    this.spriteCanvas[i].height = 16;
    this.spriteCtx[i] = this.spriteCanvas[i].getContext('2d');
  }

  this.tileBuffer = new ArrayBuffer(8 * 8 * 4);
  this.tileBuffer32bit = new Uint32Array(this.tileBuffer);
  this.tileModified = new Array();
  for (var i = 0; i < 256; i++) {
    this.tileModified[i] = new Date();
  }

  this.intEnable = 0;

  this.vstatus = 0;
  this.hstatus = 0;

  this.divider = 0;
  this.timer = 0;
  this.timerControl = 0;

  this.clockDivider = 0;
  this.clockTimer = 0;

  this.lcdstat = 0;
  this.paused = false;
  this.fps = 0;

  this.keys = 255;

  this.transfer = 0;
  this.transferByte = 0xff;
  this.transferIncoming = -1;
  this.transferClockOrigin = 1;
  this.transferOut = null;

  this.init = function() {
    var _this = this;
    this.interval = setTimeout(function() {
      _this.execute();
    }, 16);
    this.fpstime = new Date();
  };

  this.pause = function() {
    if (!this.paused) {
      this.paused = true;
    } else {
      this.paused = false;
    }
  };

  this.setCartridgeRam = function(datastring) {
    this.cartram = new ArrayBuffer(datastring.length);
    this.cartram8bit = new Uint8Array(this.cartram);
    for (var i = 0; i < datastring.length; i++) {
      this.cartram8bit[i] = datastring.charCodeAt(i);
    }
  };

  this.execute = function() {
    var _this = this;
    this.interval = setTimeout(function() {
      _this.execute();
    }, 16);
    // 4213440 ticks per second
    if (this.paused) return;
    this.transferClock();
    for (var i = 0; i < 154 * 4; i++) {
      this.z80.execute(114);
      this.timerControlAdd(114);
      this.LCDStatusAdd();
    }
  };

  this.LCDStatusAdd = function() {
    if (this.vstatus == this.io8bit[0x45]) {
      // LYC == LY ?
      this.lcdstat |= 4;
      if (this.hstatus == 0 && this.lcdstat & 64) {
        this.LCDInt();
      }
    } else {
      this.lcdstat &= ~4;
    }

    this.lcdstat &= ~3;
    if (this.vstatus < 144) {
      if (this.hstatus == 0) {
        this.lcdstat |= 2;
      } else if (this.hstatus == 1) {
        if (this.io8bit[0x40] & 128) this.drawLine(this.vstatus);
        this.lcdstat |= 3;
      } else if (this.hstatus == 4) {
        this.vstatus++;
        this.hstatus = -1;
      }
    } else {
      if (this.vstatus == 144 && this.hstatus == 0) {
        this.fps++;
        if (this.fps == 60) {
          if (this.onFPS != null)
            this.onFPS(
              'FPS: ' + Math.round(1000 / (new Date() - this.fpstime))
            );
          this.fps = 0;
        }
        this.fpstime = new Date();
        this.vblankInt();
        if (this.lcdstat & 16) {
          this.LCDInt();
        }
      }

      this.lcdstat |= 1;
      if (this.hstatus == 4) {
        this.hstatus = -1;
        this.vstatus++;
      }
      if (this.vstatus == 154) this.vstatus = 0;
    }
    this.hstatus++;
  };

  this.timerControlAdd = function(n) {
    this.clockDivider += n;
    if (this.clockDivider >= 257) {
      this.divider = (this.divider + 1) % 256;
      this.clockDivider %= 257;
    }
    if (this.timerControl & 4) {
      this.clockTimer += n;
      if (this.timerControl & (3 == 0)) {
        while (this.clockTimer >= 1024) {
          this.timerAddOne();
          this.clockTimer -= 1024;
        }
      } else if (this.timerControl & (3 == 1)) {
        while (this.clockTimer >= 16) {
          this.timerAddOne();
          this.clockTimer -= 16;
        }
      } else if (this.timerControl & (3 == 2)) {
        while (this.clockTimer >= 64) {
          this.timerAddOne();
          this.clockTimer -= 64;
        }
      } else if (this.timerControl & (3 == 3)) {
        while (this.clockTimer >= 256) {
          this.timerAddOne();
          this.clockTimer -= 256;
        }
      }
    }
  };

  this.timerAddOne = function() {
    this.timer++;
    if (this.timer >= 256) {
      this.timerInt();
      this.timer = this.io8bit[0x06];
    }
  };

  this.keyPressed = function(key) {
    this.z80.resume();
    if (this.keys & key) {
      this.keys &= ~key;
      this.joypadInt();
    }
  };

  this.keyReleased = function(key) {
    this.keys |= key;
  };

  this.transferIn = function(data) {
    this.transferIncoming = data;
    /*if(external) this.transferClockOrigin = 0;
      else this.transferClockOrigin = 1;
      return this.transferByte;*/
  };

  this.transferClock = function() {
    if (this.transfer && this.transferIncoming != -1) {
      this.transferByte = this.transferIncoming;
      this.transfer = 0;
      this.transferIncoming = -1;
      /*if(this.transferOut != undefined) */ this.serialInt();
    }
  };

  this.vblankInt = function() {
    this.io8bit[15] |= 1;
    this.executeInt();
  };
  this.LCDInt = function() {
    this.io8bit[15] |= 2;
    this.executeInt();
  };
  this.timerInt = function() {
    this.io8bit[15] |= 4;
    this.executeInt();
  };
  this.serialInt = function() {
    this.io8bit[15] |= 8;
    this.executeInt();
  };
  this.joypadInt = function() {
    this.io8bit[15] |= 16;
    this.executeInt();
  };

  this.executeInt = function() {
    var intvector = this.io8bit[15];
    if (intvector & 1 && this.intEnable & 1 && this.z80.interrupt(64))
      intvector &= ~1;
    if (intvector & 2 && this.intEnable & 2 && this.z80.interrupt(72))
      intvector &= ~2;
    if (intvector & 4 && this.intEnable & 4 && this.z80.interrupt(80))
      intvector &= ~4;
    if (intvector & 8 && this.intEnable & 8 && this.z80.interrupt(88))
      intvector &= ~8;
    if (intvector & 16 && this.intEnable & 16 && this.z80.interrupt(96))
      intvector &= ~16;
    this.io8bit[15] = intvector;
  };

  this.getAddress = function(address) {
    //console.log("Lee memoria", address);
    if (address >= 0 && address < 0x4000) {
      // Cartridge ROM Bank 00 (0000-3FFF)
      return this.rom8bit[address];
    } else if (address >= 0x4000 && address < 0x8000) {
      // Cartridge ROM Bank 01..nn (4000-7FFF)
      return this.rom8bit[address + 0x4000 * (this.activeRomBank - 1)];
    } else if (address >= 0x8000 && address < 0xa000) {
      // Video RAM (8000-9FFF)
      return this.vram8bit[address - 0x8000];
    } else if (address >= 0xa000 && address < 0xc000) {
      // Cartridge RAM Bank (A000-BFFF)
      if (this.cartram == undefined || this.ramEnabled == 0) return 0;
      if (
        address - 0xa000 + this.activeRamBank * 8192 >=
        this.cartram8bit.length
      )
        return 0;
      return this.cartram8bit[address - 0xa000 + this.activeRamBank * 8192];
    } else if (address >= 0xc000 && address < 0xe000) {
      // Work RAM Banks (C000-DFFF)
      return this.wram8bit[address - 0xc000];
    } else if (address >= 0xe000 && address < 0xfe00) {
      // Same as C000-DDFF (E000-FDFF)
      return this.wram8bit[address - 0xe000];
    } else if (address >= 0xfe00 && address < 0xfea0) {
      // Sprite Attribute Table (OAM) (FE00-FE9F)
      return this.spriteram8bit[address - 0xfe00];
    } else if (address >= 0xff00 && address < 0xff80) {
      // I/O (FF00-FF7F)
      return this.getIO(address % 0xff00);
    } else if (address >= 0xff80 && address <= 0xfffe) {
      // High RAM / Stack (HRAM) (FF80-FFFE)
      return this.hram8bit[address - 0xff80];
    } else if (address == 0xffff) {
      // Interrupt Enable Register
      return this.intEnable;
    } else {
      return 0;
    }
  };

  this.putAddress = function(address, data) {
    //console.log("Escribe memoria", address, data);
    if (address >= 0 && address < 0x2000) {
      // RAM enable
      if (data == 0) this.ramEnabled = 0;
      if (data == 0x0a) this.ramEnabled = 1;
    } else if (address >= 0x2000 && address < 0x4000) {
      // Cambio de banco ROM
      //console.log("Cambio de banco a "+(data % 32), this.z80.PC);
      this.activeRomBank = data % 32;
    } else if (address >= 0x4000 && address < 0x6000) {
      // RAM Bank Number / Upper Bits of ROM Bank Number
      if (this.romRamMode == 0) {
        // ROM Mode
        this.activeRomBank = (this.activeRomBank & 0x1f) | (data % 4 << 5);
      } else if (this.romRamMode == 1) {
        // RAM Mode
        this.activeRamBank = data % 4;
      }
    } else if (address >= 0x6000 && address < 0x8000) {
      // ROM/RAM Mode Select
      this.romRamMode = data & 1;
    } else if (address >= 0x8000 && address < 0xa000) {
      // Video RAM (8000-9FFF)
      //if(data != 0) console.log("-- Escritura VRAM", address, data);
      this.vram8bit[address - 0x8000] = data;
      if (address >= 0x8800 && address < 0x9800) {
        var tile = Math.floor((address - 0x9000) / 16);
        if (tile < 0) tile += 256;
        this.tileModified[tile] = new Date();
      } else if (address >= 0x8000 && address < 0x9000) {
        var tile = Math.floor((address - 0x8000) / 16);
        this.tileModified[tile] = new Date();
      }
    } else if (address >= 0xa000 && address < 0xc000) {
      // Cartridge RAM Bank (A000-BFFF)
      if (this.cartram == undefined || this.ramEnabled == 0) return;
      if (
        address - 0xa000 + this.activeRamBank * 8192 >=
        this.cartram8bit.length
      )
        return;
      this.cartram8bit[address - 0xa000 + this.activeRamBank * 8192] = data;
    } else if (address >= 0xc000 && address < 0xe000) {
      // Work RAM Banks (C000-DFFF)
      this.wram8bit[address - 0xc000] = data;
      var vramaddress = address - 0xc000;
      /////
    } else if (address >= 0xe000 && address < 0xfe00) {
      // Same as C000-DDFF
      this.wram8bit[address - 0xe000] = data;
    } else if (address >= 0xfe00 && address < 0xfea0) {
      // Sprite Attribute Table (OAM) (FE00-FE9F)
      //if(data != 0) console.log("-- Escritura Sprite", address, data);
      this.spriteram8bit[address - 0xfe00] = data;
    } else if (address >= 0xff00 && address < 0xff80) {
      // I/O (FF00-FF7F)
      //console.log("-- Escritura E/S", Math.floor((address-0xFF00)/16), (address-0xFF00)%16, data, this.z80.RA);
      this.putIO(address % 0xff00, data);
    } else if (address >= 0xff80 && address <= 0xfffe) {
      // High RAM / Stack (HRAM) (FF80-FFFE)
      //console.log("-- Escritura HRAM", address-0xFF80, data, this.z80.reg16bit[this.z80.REG_PC]);
      this.hram8bit[address - 0xff80] = data;
    } else if (address == 0xffff) {
      // Interrupt Enable Register
      this.intEnable = data;
    }
  };

  this.getIO = function(address) {
    if (address == 0) {
      if ((this.io8bit[0] & 48) == 48) {
        return this.io8bit[0] & ~15;
      } else if ((this.io8bit[0] & 48) == 32) {
        // Direction keys
        return (this.io8bit[0] & ~15) | (this.keys & 15);
      } else if ((this.io8bit[0] & 48) == 16) {
        // Button keys
        return (this.io8bit[0] & ~15) | (this.keys >> 4);
      }
      return this.io8bit[0] | 15;
    } else if (address == 0x01) {
      return this.transferByte;
    } else if (address == 0x02) {
      return (this.transfer << 7) | this.transferClockOrigin;
    } else if (address == 0x04) {
      return this.divider;
    } else if (address == 0x05) {
      return this.timer;
    } else if (address == 0x07) {
      return this.timerControl;
    } else if (address == 0x41) {
      return this.lcdstat;
    } else if (address == 0x44) {
      return this.vstatus;
    } else {
      //console.log("-- Lectura E/S", Math.floor((address)/16), (address)%16, this.z80.PC);
      return this.io8bit[address];
    }
  };

  this.putIO = function(address, data) {
    if (address == 0x01) {
      this.transferByte = data;
    } else if (address == 0x02) {
      this.transferClockOrigin = data & 1;
      if (this.transfer == 0 && data & 0x80) {
        this.transfer = 1;
        //if(this.transferOut == undefined){
        if (this.transferClockOrigin) this.transferIn(0xff);
        /*}else{
               this.transferOut(this.transferByte);
            }*/
      }
    } else if (address == 0x04) {
      this.divider = 0;
    } else if (address == 0x05) {
      this.timer = 0;
    } else if (address == 0x07) {
      this.timerControl = data;
    } else if (address == 0x0f) {
      this.io8bit[address] = data;
      this.executeInt();
    } else if (address == 0x40) {
      this.io8bit[address] = data;
    } else if (address == 0x41) {
      this.lcdstat &= ~120;
      this.lcdstat |= data & ~135;
    } else if (address == 0x46) {
      for (var i = 0; i < 160; i++) {
        this.putAddress(0xfe00 + i, this.getAddress((data << 8) + i));
      }
    } else if (address == 0x47) {
      if (this.io8bit[0x47] != data) {
        for (var i = 0; i < this.bgMap.length; i++) {
          for (var j = 0; j < this.bgMap[i].length; j++) {
            this.bgMap[i][j] = -1;
          }
        }
        for (var i = 0; i < this.winMap.length; i++) {
          for (var j = 0; j < this.winMap[i].length; j++) {
            this.winMap[i][j] = -1;
          }
        }
      }
      this.io8bit[0x47] = data;
    } else {
      this.io8bit[address] = data;
    }
  };

  this.getPalette = function() {
    var bgpalette = this.io8bit[0x47];
    return new Array(
      (2 * (bgpalette & 2)) / 2 + (bgpalette & 1) / 1,
      (2 * (bgpalette & 8)) / 8 + (bgpalette & 4) / 4,
      (2 * (bgpalette & 32)) / 32 + (bgpalette & 16) / 16,
      (2 * (bgpalette & 128)) / 128 + (bgpalette & 64) / 64
    );
  };

  this.getObj0Palette = function() {
    var bgpalette = this.io8bit[0x48];
    return new Array(
      (2 * (bgpalette & 2)) / 2 + (bgpalette & 1) / 1,
      (2 * (bgpalette & 8)) / 8 + (bgpalette & 4) / 4,
      (2 * (bgpalette & 32)) / 32 + (bgpalette & 16) / 16,
      (2 * (bgpalette & 128)) / 128 + (bgpalette & 64) / 64
    );
  };

  this.getObj1Palette = function() {
    var bgpalette = this.io8bit[0x49];
    return new Array(
      (2 * (bgpalette & 2)) / 2 + (bgpalette & 1) / 1,
      (2 * (bgpalette & 8)) / 8 + (bgpalette & 4) / 4,
      (2 * (bgpalette & 32)) / 32 + (bgpalette & 16) / 16,
      (2 * (bgpalette & 128)) / 128 + (bgpalette & 64) / 64
    );
  };

  this.remapBgMap = function(tiley) {
    if (this.io8bit[0x40] & 0x08) {
      // (0=9800-9BFF, 1=9C00-9FFF)
      var offset = 0x1c00 + tiley * 32;
    } else {
      var offset = 0x1800 + tiley * 32;
    }
    for (var i = 0; i < 32; i++) {
      var tile = this.vram8bit[offset++];
      if (
        tile != this.bgMap[i][tiley] ||
        this.bgModified[i][tiley] < this.tileModified[tile]
      ) {
        this.redrawTile(tile);
        var imagedata = this.bgCtx.getImageData(i * 8, tiley * 8, 8, 8);
        imagedata.data.set(new Uint8Array(this.tileBuffer));
        this.bgCtx.putImageData(imagedata, i * 8, tiley * 8);
        this.bgMap[i][tiley] = tile;
        this.bgModified[i][tiley] = new Date();
      }
    }
  };

  this.remapWindowMap = function(tiley) {
    if (this.io8bit[0x40] & 0x40) {
      // (0=9800-9BFF, 1=9C00-9FFF)
      var baseaddress = 0x1c00;
    } else {
      var baseaddress = 0x1800;
    }
    var offset = baseaddress + tiley * 32;
    for (var i = 0; i < 32; i++) {
      var tile = this.vram8bit[offset++];
      if (
        tile != this.winMap[i][tiley] ||
        this.winModified[i][tiley] < this.tileModified[tile]
      ) {
        this.redrawTile(tile);
        var imagedata = this.winCtx.getImageData(i * 8, tiley * 8, 8, 8);
        imagedata.data.set(new Uint8Array(this.tileBuffer));
        this.winCtx.putImageData(imagedata, i * 8, tiley * 8);
        this.winMap[i][tiley] = tile;
        this.winModified[i][tiley] = new Date();
      }
    }
  };

  this.redrawTile = function(tilenumber) {
    if (this.io8bit[0x40] & 0x10) {
      // (0=8800-97FF, 1=8000-8FFF)
      var tile = tilenumber;
      var baseaddress = 0;
    } else {
      var tile = tilenumber >= 128 ? tilenumber - 256 : tilenumber;
      var baseaddress = 0x1000;
    }
    var palette = this.getPalette();
    var offset = 0;
    for (var line = 0; line < 8; line++) {
      var lowerbyte = this.vram8bit[baseaddress + tile * 16 + line * 2];
      var upperbyte = this.vram8bit[baseaddress + tile * 16 + line * 2 + 1];
      for (var pixel = 7; pixel >= 0; pixel--) {
        var color =
          2 * ((upperbyte & (1 << pixel)) / (1 << pixel)) +
          (lowerbyte & (1 << pixel)) / (1 << pixel);
        switch (palette[color]) {
          case 0:
            this.tileBuffer32bit[offset++] = this.COLOR0;
            break;
          case 1:
            this.tileBuffer32bit[offset++] = this.COLOR1;
            break;
          case 2:
            this.tileBuffer32bit[offset++] = this.COLOR2;
            break;
          case 3:
            this.tileBuffer32bit[offset++] = this.COLOR3;
            break;
        }
      }
    }
  };

  this.redrawSpriteTile = function(tilenumber, palette) {
    var tile = tilenumber;
    var baseaddress = 0;
    var offset = 0;
    for (var line = 0; line < 8; line++) {
      var lowerbyte = this.vram8bit[baseaddress + tile * 16 + line * 2];
      var upperbyte = this.vram8bit[baseaddress + tile * 16 + line * 2 + 1];
      for (var pixel = 7; pixel >= 0; pixel--) {
        var color =
          2 * ((upperbyte & (1 << pixel)) / (1 << pixel)) +
          (lowerbyte & (1 << pixel)) / (1 << pixel);
        if (color == 0) {
          this.tileBuffer32bit[offset++] =
            (0 << 24) | (255 << 16) | (255 << 8) | 255;
          continue;
        }
        switch (palette[color]) {
          case 0:
            this.tileBuffer32bit[offset++] = this.COLOR0;
            break;
          case 1:
            this.tileBuffer32bit[offset++] = this.COLOR1;
            break;
          case 2:
            this.tileBuffer32bit[offset++] = this.COLOR2;
            break;
          case 3:
            this.tileBuffer32bit[offset++] = this.COLOR3;
            break;
        }
      }
    }
  };

  this.getSprites = function(line) {
    var palette0 = this.getObj0Palette();
    var palette1 = this.getObj1Palette();

    var sprites = new Array();
    for (var i = 0; i < 40; i++) {
      var sprite = new Object();
      sprite.n = i;
      sprite.y = this.spriteram8bit[i * 4] - 16;
      sprite.x = this.spriteram8bit[i * 4 + 1] - 8;
      sprite.tile = this.spriteram8bit[i * 4 + 2];
      sprite.flags = this.spriteram8bit[i * 4 + 3];
      if (
        this.io8bit[0x40] & 4 &&
        line - sprite.y < 16 &&
        line - sprite.y >= 0 &&
        sprite.x > -8 &&
        sprite.x < 160
      ) {
        sprites.push(sprite);
      } else if (
        (this.io8bit[0x40] & 4) == 0 &&
        line - sprite.y < 8 &&
        line - sprite.y >= 0 &&
        sprite.x > -8 &&
        sprite.x < 160
      ) {
        sprites.push(sprite);
      } else {
        continue;
      }

      if (this.spriteMap[i] != sprite.tile) {
        if (sprite.flags & 16) {
          this.redrawSpriteTile(
            this.io8bit[0x40] & 4 ? sprite.tile & 254 : sprite.tile,
            palette1
          );
        } else {
          this.redrawSpriteTile(
            this.io8bit[0x40] & 4 ? sprite.tile & 254 : sprite.tile,
            palette0
          );
        }
        var imagedata = this.spriteCtx[i].getImageData(0, 0, 8, 8);
        imagedata.data.set(new Uint8Array(this.tileBuffer));
        this.spriteCtx[i].putImageData(imagedata, 0, 0);

        if (this.io8bit[0x40] & 4) {
          if (sprite.flags & 16) {
            this.redrawSpriteTile(sprite.tile | 1, palette1);
          } else {
            this.redrawSpriteTile(sprite.tile | 1, palette0);
          }
          var imagedata = this.spriteCtx[i].getImageData(0, 8, 8, 8);
          imagedata.data.set(new Uint8Array(this.tileBuffer));
          this.spriteCtx[i].putImageData(imagedata, 0, 8);
        }

        this.spriteMap[i] = sprite.tile;
      }
    }
    return sprites;
  };

  this.drawLine = function(line) {
    var lcdconfig = this.io8bit[0x40];

    if (lcdconfig & 1 || lcdconfig & 32) {
      var palette = this.getPalette();
    }
    // Main BG
    if (lcdconfig & 1) {
      var pixelx = this.io8bit[0x43] % 8;
      var pixely = ((line + this.io8bit[0x42] + 256) % 256) % 8;
      var tilex = 0;
      var tiley = Math.floor(((line + this.io8bit[0x42] + 256) % 256) / 8);

      this.remapBgMap(tiley);

      var width = Math.min(256 - this.io8bit[0x43], 160);
      this.displaycanvas.drawImage(
        this.bgCanvas,
        this.io8bit[0x43],
        (line + this.io8bit[0x42] + 256) % 256,
        width,
        1,
        0,
        line,
        width,
        1
      );

      if (width < 160) {
        this.displaycanvas.drawImage(
          this.bgCanvas,
          0,
          (line + this.io8bit[0x42] + 256) % 256,
          160 - width,
          1,
          width,
          line,
          160 - width,
          1
        );
      }
    }
    // Window BG
    if (
      lcdconfig & 32 &&
      line >= this.io8bit[0x4a] &&
      this.io8bit[0x4a] < 143 &&
      this.io8bit[0x4b] < 166
    ) {
      var pixelx = (this.io8bit[0x4b] - 7) % 8;
      var pixely = (line - this.io8bit[0x4a]) % 8;
      var tilex = 0;
      var tiley = Math.floor((line - this.io8bit[0x4a]) / 8);

      this.remapWindowMap(tiley);

      var width = Math.min(160 - (this.io8bit[0x4b] - 7));
      this.displaycanvas.drawImage(
        this.winCanvas,
        0,
        line - this.io8bit[0x4a],
        width,
        1,
        this.io8bit[0x4b] - 7,
        line,
        width,
        1
      );
    }
    // Sprites
    if (lcdconfig & 2) {
      var sprites = this.getSprites(line);
      for (var i = 0; sprites[i] != undefined; i++) {
        var n = sprites[i].n;

        this.displaycanvas.save();
        this.displaycanvas.transform(
          sprites[i].flags & 32 ? -1 : 1,
          0,
          0,
          1,
          0,
          0
        );
        if ((this.io8bit[0x40] & 4) == 0) {
          this.displaycanvas.drawImage(
            this.spriteCanvas[n],
            0,
            sprites[i].flags & 64
              ? 7 - (line - sprites[i].y)
              : line - sprites[i].y,
            8,
            1,
            sprites[i].flags & 32 ? -sprites[i].x - 8 : sprites[i].x,
            line,
            8,
            1
          );
        } else {
          this.displaycanvas.drawImage(
            this.spriteCanvas[n],
            0,
            sprites[i].flags & 64
              ? 15 - (line - sprites[i].y)
              : line - sprites[i].y,
            8,
            1,
            sprites[i].flags & 32 ? -sprites[i].x - 8 : sprites[i].x,
            line,
            8,
            1
          );
        }
        this.displaycanvas.restore();
      }
    }
  };

  this.z80 = Z80(window, {
    getAddress: function() {
      return _this.getAddress.apply(_this, arguments);
    },
    putAddress: function() {
      _this.putAddress.apply(_this, arguments);
    },
    executeInt: function() {
      _this.executeInt.apply(_this, arguments);
    },
    start: 256
  });
};
