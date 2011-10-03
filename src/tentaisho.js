//
// パズル固有スクリプト部 天体ショー版 tentaisho.js v3.4.0
//
pzprv3.custom.tentaisho = {
//---------------------------------------------------------
// マウス入力系
MouseEvent:{
	inputedit : function(){
		if(this.mousestart && this.btn.Left){
			this.inputstar();
		}
		else if((this.mousestart || this.mousemove) && this.btn.Right){
			this.inputBGcolor1();
		}
	},
	inputplay : function(){
		if(this.mousestart || this.mousemove){
			if(this.mousestart && this.btn.Left){ this.checkBorderMode();}

			if(this.bordermode){ this.inputborder_tentaisho();}
			else{ this.inputQsubLine();}
		}
		else if(this.mouseend && this.notInputted()){ this.inputBGcolor3();}
	},

	inputBGcolor1 : function(){
		var cell = this.getcell();
		if(cell.isnull || cell===this.mouseCell){ return;}
		if(this.inputData===null){ this.inputData=(cell.getQsub()===0)?3:0;}
		cell.setQsub(this.inputData);
		this.mouseCell = cell; 
		cell.draw();
	},
	inputBGcolor3 : function(){
		if(pzprv3.EDITOR){ if(pp.getVal('discolor')){ return;} }

		var pos = this.borderpos(0.34);
		var id = bd.snum(pos.bx, pos.by);
		if(id===null || bd.getStar(id)===0){ return;}

		var cell=null, group=bd.star[id].group, gid=bd.star[id].obj.id;
		if(group===bd.CELL){
			cell = bd.star[id].obj;
		}
		else if(group===bd.CROSS && bd.areas.rinfo.bdcnt[gid]===0){
			cell = bd.getc(bd.star[id].bx-1, bd.star[id].by-1);
		}
		else if(group===bd.BORDER && bd.border[gid].getQans()===0){
			cell = bd.border[gid].sidecell[0];
		}

		if(cell!==null){
			var clist = bd.areas.rinfo.getClistByCell(cell);
			if(bd.encolor(clist)){
				var d = clist.getRectSize();
				pc.paintRange(d.x1, d.y1, d.x2, d.y2);
			}
		}
	},
	inputborder_tentaisho : function(){
		var pos = this.borderpos(0.34);
		if(this.prevPos.equals(pos)){ return;}

		var border = this.getborderobj(this.prevPos, pos);
		if(!border.isnull){
			if(this.inputData===null){ this.inputData=(border.getQans()===0?1:0);}
			border.setQans(this.inputData);
			border.draw();
		}
		this.prevPos = pos;
	},
	inputstar : function(){
		var pos = this.borderpos(0.25);
		if(this.prevPos.equals(pos)){ return;}

		var id = bd.snum(pos.bx, pos.by);
		if(id!==null){
			if     (this.btn.Left) { bd.setStar(id, {0:1,1:2,2:0}[bd.getStar(id)]);}
			else if(this.btn.Right){ bd.setStar(id, {0:2,1:0,2:1}[bd.getStar(id)]);}
		}
		this.prevPos = pos;
		pos.draw();
	}
},

//---------------------------------------------------------
// キーボード入力系
KeyEvent:{
	enablemake : true,
	moveTarget : function(ca){ return this.moveTBorder(ca); },

	keyinput : function(ca){
		this.key_inputstar(ca);
	},
	key_inputstar : function(ca){
		var pos = tc.getTCP(), id = bd.snum(pos.bx, pos.by);
		if(id!==null){
			if     (ca=='1'){ bd.setStar(id,1);}
			else if(ca=='2'){ bd.setStar(id,2);}
			else if(ca==' '||ca=='-'||ca=='0'||ca=='3'){ bd.setStar(id,0);}
			pos.draw();
		}
	}
},

//---------------------------------------------------------
// 盤面管理系
Cell:{
	qnum : 0,
	minnum : 0,

	disInputHatena : true,

	// 一部qsubで消したくないものがあるため上書き
	subclear : function(){
		if(this.qsub===1){
			um.addOpe_Object(this, bd.QSUB, 1, 0);
			this.qsub = 0;
		}
		this.error = 0;
	}
},
Cross:{
	qnum : 0,
	minnum : 0
},
Border:{
	qnum : 0,
	minnum : 0
},

Board:{
	iscross  : 1,
	isborder : 1,

	initialize : function(owner){
		this.SuperFunc.initialize.call(this, owner);

		this.star = []; /* インスタンス化 */
	},

	initBoardSize : function(col,row){
		this.SuperFunc.initBoardSize.call(this,col,row);

		this.initStar(col,row);
	},

	// 星アクセス用関数
	starmax : 0,
	star : [],
	initStar : function(col,row){
		this.starmax = (2*col-1)*(2*row-1);
		this.star = [];
		var pos = new pzprv3.core.Address(this.owner,0,0);
		for(var id=0;id<this.starmax;id++){
			this.star[id] = {};
			var obj = this.star[id];
			obj.bx = id%(2*col-1)+1;
			obj.by = ((id/(2*col-1))|0)+1;
			pos.init(obj.bx, obj.by);
			if(pos.oncell()){
				obj.group = this.CELL;
				obj.obj = pos.getc();
			}
			else if(pos.oncross()){
				obj.group = this.CROSS;
				obj.obj = pos.getx();
			}
			else{
				obj.group = this.BORDER;
				obj.obj = pos.getb();
			}
		}
	},
	snum : function(sx,sy){
		if(sx<=this.minbx || this.maxbx<=sx || sy<=this.minby || this.maxby<=sy){ return null;}
		return ((sx-1)+(sy-1)*(2*this.qcols-1));
	},
	starinside : function(x1,y1,x2,y2){
		var idlist = [];
		for(var by=y1;by<=y2;by++){ for(var bx=x1;bx<=x2;bx++){
			var id = this.snum(bx,by);
			if(id!==null){ idlist.push(id);}
		}}
		return idlist;
	},

	getStar : function(id){
		return this.star[id].obj.getQnum();
	},
	isStarError : function(id){
		return (this.star[id].obj.error!==0);
	},
	setStar : function(id,val){
		um.disCombine = true;
		return this.star[id].obj.setQnum(val);
		um.disCombine = false;
	},

	// 色をつける系関数
	encolorall : function(){
		var rinfo = this.areas.getRoomInfo();
		for(var id=1;id<=rinfo.max;id++){ this.encolor(rinfo.getclist(id));}
		pc.paintAll();
	},
	encolor : function(clist){
		var id = this.getAreaStarInfo(clist).id;
		var flag = false, ret = (id!==null ? this.getStar(id) : 0);
		for(var i=0;i<clist.length;i++){
			var cell = clist[i];
			if(pzprv3.EDITOR && cell.getQsub()===3 && ret!=2){ continue;}
			else if(cell.getQsub()!==(ret>0?ret:0)){
				cell.setQsub(ret>0?ret:0);
				flag = true;
			}
		}
		return flag;
	},

	// 領域と入っている星を取得する関数
	getAreaStarInfoAll : function(){
		var rinfo = this.areas.getRoomInfo();
		for(var id=1;id<=rinfo.max;id++){
			var obj = this.getAreaStarInfo(rinfo.getclist(id));
			rinfo.room[id].starid = obj.id;
			rinfo.room[id].error  = obj.err;
		}
		return rinfo;
	},
	getAreaStarInfo : function(clist){
		var cnt=0, ret={id:null, err:-1};
		for(var i=0;i<clist.length;i++){
			var cell=clist[i], bx=cell.bx, by=cell.by;
			var idlist = this.starinside(bx,by,bx+1,by+1);
			for(var n=0;n<idlist.length;n++){
				var id=idlist[n], group=this.star[id].group, gid=this.star[id].obj.id;
				if(this.getStar(id)>0){
					if( group===this.CELL ||
					   (group===this.CROSS && this.areas.rinfo.bdcnt[gid]===0) ||
					   (group===this.BORDER && this.border[gid].getQans()===0)
					)
					{ cnt++; ret={id:id, err:0};}
				}
			}

			if(cnt>1){ return {id:null, err:-2};}
		}
		return ret;
	},

	adjustBoardData2 : function(key,d){
		this.initStar(this.qcols, this.qrows);
	}
},

AreaManager:{
	hasroom : true
},

Menu:{
	menufix : function(){
		if(pzprv3.EDITOR){
			pp.addCheck('discolor','setting',false,'色分け無効化','Disable color');
			pp.setLabel('discolor', '星クリックによる色分けを無効化する', 'Disable Coloring up by clicking star');
		}

		var el = ee.createEL(this.EL_BUTTON, 'btncolor');
		this.addButtons(el, ee.binder(bd, bd.encolorall), "色をつける","Color up");
		ee('btnarea').appendEL(el);
	}
},

//---------------------------------------------------------
// 画像表示系
Graphic:{
	setColors : function(){
		this.gridcolor = this.gridcolor_LIGHT;
		this.borderQanscolor = "rgb(72, 72, 72)";
		this.qsubcolor1 = "rgb(176,255,176)";
		this.qsubcolor2 = "rgb(108,108,108)";
		this.errbcolor1 = this.errbcolor1_DARK;
		this.setBGCellColorFunc('qsub3');
	},
	paint : function(){
		this.drawBGCells();
		this.drawDashedGrid();

		this.drawQansBorders();
		this.drawBorderQsubs();

		this.drawStars();

		this.drawChassis();

		this.drawTarget_tentaisho();
	},

	drawStars : function(){
		var g = this.vinc('star', 'auto');

		g.lineWidth = Math.max(this.cw*0.04, 1);
		var headers = ["s_star1_", "s_star2_"];

		var d = this.range;
		var idlist = bd.starinside(d.x1,d.y1,d.x2,d.y2);
		for(var i=0;i<idlist.length;i++){
			var id = idlist[i], bx=bd.star[id].bx, by=bd.star[id].by;

			if(bd.getStar(id)===1){
				g.strokeStyle = (bd.isStarError(id) ? this.errcolor1 : this.cellcolor);
				g.fillStyle   = "white";
				if(this.vnop(headers[0]+id,this.STROKE)){
					g.shapeCircle(bx*this.bw, by*this.bh, this.cw*0.16);
				}
			}
			else{ this.vhide(headers[0]+id);}

			if(bd.getStar(id)===2){
				g.fillStyle = (bd.isStarError(id) ? this.errcolor1 : this.cellcolor);
				if(this.vnop(headers[1]+id,this.FILL)){
					g.fillCircle(bx*this.bw, by*this.bh, this.cw*0.18);
				}
			}
			else{ this.vhide(headers[1]+id);}
		}
	},

	drawTarget_tentaisho : function(){
		this.drawCursor(false,this.owner.editmode);
	}
},

//---------------------------------------------------------
// URLエンコード/デコード処理
Encode:{
	pzlimport : function(type){
		this.decodeStar();
	},
	pzlexport : function(type){
		this.encodeStar();
	},

	decodeKanpen : function(){
		fio.decodeStarFile();
	},
	encodeKanpen : function(){
		fio.encodeStarFile();
	},

	decodeStar : function(bstr){
		bd.disableInfo();
		var s=0, bstr = this.outbstr;
		for(var i=0;i<bstr.length;i++){
			var ca = bstr.charAt(i);
			if(this.include(ca,"0","f")){
				var val = parseInt(ca,16);
				bd.setStar(s,val%2+1);
				s+=((val>>1)+1);
			}
			else if(this.include(ca,"g","z")){ s+=(parseInt(ca,36)-15);}

			if(s>=bd.starmax){ break;}
		}
		bd.enableInfo();
		this.outbstr = bstr.substr(i+1);
	},
	encodeStar : function(){
		var count = 0;
		var cm = "";

		for(var s=0;s<bd.starmax;s++){
			var pstr = "";
			if(bd.getStar(s)>0){
				for(var i=1;i<=7;i++){
					if(!!bd.star[s+i] && bd.getStar(s+i)>0){
						pstr=""+(2*(i-1)+(bd.getStar(s)-1)).toString(16);
						s+=(i-1); break;
					}
				}
				if(pstr===""){ pstr=(13+bd.getStar(s)).toString(16); s+=7;}
			}
			else{ count++;}

			if(count==0){ cm += pstr;}
			else if(pstr || count==20){ cm += ((count+15).toString(36)+pstr); count=0;}
		}
		if(count>0){ cm += ((count+15).toString(36));}

		this.outbstr += cm;
	}
},
//---------------------------------------------------------
FileIO:{
	decodeData : function(){
		this.decodeStarFile();
		this.decodeBorderAns();
		this.decodeCellQsub();
	},
	encodeData : function(){
		this.encodeStarFile();
		this.encodeBorderAns();
		this.encodeCellQsub();
	},

	kanpenOpen : function(){
		this.decodeStarFile();
		this.decodeAnsAreaRoom();
	},
	kanpenSave : function(){
		this.encodeStarFile();
		this.encodeAnsAreaRoom();
	},

	decodeStarFile : function(){
		var array = this.readLines(2*bd.qrows-1), s=0;
		bd.disableInfo();
		for(var i=0;i<array.length;i++){
			for(var c=0;c<array[i].length;c++){
				if     (array[i].charAt(c)==="1"){ bd.setStar(s, 1);}
				else if(array[i].charAt(c)==="2"){ bd.setStar(s, 2);}
				s++;
			}
		}
		bd.enableInfo();
	},
	encodeStarFile : function(){
		var s=0;
		for(var by=1;by<=2*bd.qrows-1;by++){
			for(var bx=1;bx<=2*bd.qcols-1;bx++){
				if     (bd.getStar(s)===1){ this.datastr += "1";}
				else if(bd.getStar(s)===2){ this.datastr += "2";}
				else                      { this.datastr += ".";}
				s++;
			}
			this.datastr += "/";
		}
	}
},

//---------------------------------------------------------
// 正解判定処理実行部
AnsCheck:{
	checkAns : function(){

		if( !this.checkStarOnLine() ){
			this.setAlert('星を線が通過しています。', 'A line goes over the star.'); return false;
		}

		var rinfo = bd.getAreaStarInfoAll();
		if( !this.checkErrorFlag(rinfo, -1) ){
			this.setAlert('星が含まれていない領域があります。','A block has no stars.'); return false;
		}

		if( !this.checkFractal(rinfo) ){
			this.setAlert('領域が星を中心に点対称になっていません。', 'A area is not point symmetric about the star.'); return false;
		}

		if( !this.checkErrorFlag(rinfo, -2) ){
			this.setAlert('星が複数含まれる領域があります。','A block has two or more stars.'); return false;
		}

		return true;
	},

	checkStarOnLine : function(){
		var result = true;
		for(var s=0;s<bd.starmax;s++){
			if(bd.getStar(s)<=0){ continue;}

			var group=bd.star[s].group, gid=bd.star[s].obj.id;
			if(group===bd.CROSS && bd.areas.rinfo.bdcnt[gid]!==0){
				if(this.inAutoCheck){ return false;}
				bd.setCrossBorderError(bd.star[s].bx, bd.star[s].by);
				result = false;
			}
			else if(group===bd.BORDER && bd.border[gid].getQans()!==0){
				if(this.inAutoCheck){ return false;}
				bd.border[gid].seterr(1);
				result = false;
			}
		}
		return result;
	},

	checkFractal : function(rinfo){
		var result = true;
		for(var r=1;r<=rinfo.max;r++){
			var clist = rinfo.getclist(r);
			var id = rinfo.room[r].starid;
			if(id===null){ continue;}
			var sx=bd.star[id].bx, sy=bd.star[id].by;
			for(var i=0;i<clist.length;i++){
				var cell = clist[i];
				var ccopy = bd.getc(sx*2-cell.bx, sy*2-cell.by);
				if(ccopy.isnull || rinfo.getRoomID(cell)!==rinfo.getRoomID(ccopy)){
					if(this.inAutoCheck){ return false;}
					clist.seterr(1); result = false;
				}
			}
		}
		return result;
	},

	checkErrorFlag : function(rinfo, val){
		var result = true;
		for(var r=1;r<=rinfo.max;r++){
			if(rinfo.room[r].error!==val){ continue;}

			if(this.inAutoCheck){ return false;}
			rinfo.getclist(r).seterr(1);
			result = false;
		}
		return result;
	}
}
};
