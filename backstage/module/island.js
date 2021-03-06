var common=require(__dirname+'/../lib/common.js');

var loginFaill={};
loginFaill.count=0;

var dataReceived=function(req,res){
	if(!req || !req.post || !req.post.do){
		rw.http.throw(3,res);
		req=null;
		res=null;
		return;
	}
	if(req.post.do!='login'){
		if(!common.checkAuth(req,res)){
			rw.log.write('Auth Fail ['+req.post.do+'] ['+req.connection.remoteAddress+']','backstage');
			req=null;
			res=null;
			return;
		}
	}
	switch(req.post.do){
		case 'login':
			if(loginFaill[req.connection.remoteAddress]){
				if((new Date().getTime()-loginFaill[req.connection.remoteAddress].t)>3600000){
					loginFaill[req.connection.remoteAddress].c=0;
				}
				if(loginFaill[req.connection.remoteAddress].c>4){
					rw.http.zout(JSON.stringify({'js':'$m.throw(json.re)','re':[2]}),req,res);
					rw.log.write('Locked Login ['+req.post.user+'] ['+req.post.pass+'] ['+req.connection.remoteAddress+']','backstage');
					rw.mail('backstage',{
						from:rw.config.mail['backstage']['auth']['user']+" <"+rw.config.mail['backstage']['auth']['user']+">",
						to:rw.config.backstage.email,
						subject:"User Login Fail 5 Times ["+req.connection.remoteAddress+"] @ "+rw.config.host,
						html:"User Login Fail 5 Times ["+req.connection.remoteAddress+"]<br /><br />@ "+rw.config.host
					},rw.emptyCall);
					req=null;
					res=null;
					return;
				}
			}
			if(req.post.user==rw.config.backstage.user && req.post.pass==rw.config.backstage.pass){
				req.session.data['rouwanbs_login']='yes';
				rw.http.zout('{"js":"$m.logined()"}',req,res);
				rw.log.write('Login ['+req.post.user+'] ['+req.connection.remoteAddress+']','backstage');
				rw.mail('backstage',{
					from:rw.config.mail['backstage']['auth']['user']+" <"+rw.config.mail['backstage']['auth']['user']+">",
					to:rw.config.backstage.email,
					subject:"User Login ["+req.connection.remoteAddress+"] @ "+rw.config.host,
					html:"User Login ["+req.connection.remoteAddress+"]<br /><br />@ "+rw.config.host
				},rw.emptyCall);
			}else{
				rw.http.zout(JSON.stringify({'js':'$m.throw(json.re)','re':[1]}),req,res);
				if(loginFaill.count>100){
					loginFaill=null;
					loginFaill={};
					loginFaill.count=0;
				}
				if(!loginFaill[req.connection.remoteAddress]){
					loginFaill[req.connection.remoteAddress]={c:0,t:new Date().getTime()};
					loginFaill.count++;
				}
				loginFaill[req.connection.remoteAddress].c++;
				rw.log.write('Bad Login '+loginFaill[req.connection.remoteAddress].c+' ['+req.post.user+'] ['+req.post.pass+'] ['+req.connection.remoteAddress+']','backstage');
			}
			req=null;
			res=null;
			break;
		case 'logout':
			delete req.session.data;
			req.session.data={};
			rw.http.zout('{"js":"$m.logouted()"}',req,res);
			rw.log.write('Logout ['+req.connection.remoteAddress+']','backstage');
			req=null;
			res=null;
			break;
		case 'exit':
			if(!rw.config.backstage.switch.exit){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			rw.http.zout('{"js":"$i.r()"}',req,res);
			rw.log.write('Exit ['+req.connection.remoteAddress+']','backstage');
			process.kill(process.pid,'SIGINT');
			break;
		case 'restart':
			if(!rw.config.backstage.switch.restart){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			rw.http.zout('{"js":"$i.r()"}',req,res);
			rw.log.write('Restart ['+req.connection.remoteAddress+']','backstage');
			rw.log.write('Restarting ...','system');
			var exec=require('child_process').exec;
			exec('node '+__dirname+'/../lib/restart.js '+process.pid+' "'+rw.config.backstage.startScript+'"');
			break;
		case 'oid':
			if(!rw.config.backstage.switch.object.view){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			var arr=req.post.oid.split('.');
			arr.shift();
			var i,o=rw;
			for(i in arr){
				if(!o[arr[i]]){
					o=null;
					break;
				}
				o=o[arr[i]];
			}
			i=null;
			arr=null;
			var o={'js':'$i.oided(json.re,json.oid)','re':o,'oid':req.post.oid};
			try{
				rw.http.zout(JSON.stringify(o),req,res);
			}catch(e){
				rw.http.zout(JSON.stringify(o,rw.util.jsonCensor(o)),req,res);
			}
			req=null;
			res=null;
			break;
		case 'oidd':
			if(!rw.config.backstage.switch.object.delete){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			var arr=req.post.oid.split('.');
			arr.shift();
			var id=arr.pop(),o=rw;
			for(i in arr){
				if(!o[arr[i]]){
					o=null;
					break;
				}
				o=o[arr[i]];
			}
			i=null;
			arr=null;
			delete o[id];
			o=null;
			id=null;	
			rw.log.write('Object Deleted ['+req.post.oid+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$i.oidded()'}),req,res);
			req=null;
			res=null;
			break;
		case 'oids':
			if(!rw.config.backstage.switch.object.edit){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			var arr=req.post.oid.split('.');
			arr.shift();
			var id=arr.pop(),o=rw;
			for(i in arr){
				if(!o[arr[i]]){
					o=null;
					break;
				}
				o=o[arr[i]];
			}
			i=null;
			arr=null;
			o[id]=req.post.o;
			o=null;
			id=null;	
			rw.log.write('Object Saved ['+req.post.oid+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$i.oidsed()'}),req,res);
			req=null;
			res=null;
			break;
		case 'sc':
			if(!rw.config.backstage.switch.session.count){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			var c=0,i;
			for(i in rw.session){
				c++;
			}
			i=null;
			rw.http.zout(JSON.stringify({'js':'$i.sced(json.re)','re':c}),req,res);
			c=null;
			req=null;
			res=null;
			break;
		case 'lc':
			if(!rw.config.backstage.switch.cache.list){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			var i,re='',c=0;
			for(i in rw.cacheData){
				re+='<li><a href="javascript:void(0)" onclick=$i.ec("'+i+'")>'+i+'</a><span>'+rw.util.date('m.d h:i:s',rw.cacheData[i].create)+'</span></li>';
				c++;
			}
			i=null;
			re='<li>Total Cache: <b>'+c+'</b>, Click to View/Edit.</li>'+re;
			rw.http.zout(JSON.stringify({'js':'$i.lced(json.re)','re':re}),req,res);
			re=null;
			c=null;
			req=null;
			res=null;
			break;
		case 'ltc':
			if(!rw.config.backstage.switch.cache.list){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			var i,re='',c=0;
			for(i in rw.tcache){
				re+='<li><a href="javascript:void(0)" onclick=$i.etc("'+i+'")>'+i+'</a></li>';
				c++;
			}
			i=null;
			re='<li>Total Cache: <b>'+c+'</b>, Click to View/Edit.</li>'+re;
			rw.http.zout(JSON.stringify({'js':'$i.lced(json.re)','re':re}),req,res);
			re=null;
			c=null;
			req=null;
			res=null;
			break;
		case 'ec':
			if(!rw.config.backstage.switch.cache.view){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			rw.http.zout(JSON.stringify({'js':'$i.eced(json.re,json.id)','re':rw.cacheData[req.post.id],'id':req.post.id}),req,res);
			req=null;
			res=null;
			break;
		case 'etc':
			if(!rw.config.backstage.switch.cache.view){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			rw.http.zout(JSON.stringify({'js':'$i.etced(json.re,json.id)','re':new Buffer(rw.tcache[req.post.id],'utf8').toString('base64'),'id':req.post.id}),req,res);
			req=null;
			res=null;
			break;
		case 'savec':
			if(!rw.config.backstage.switch.cache.edit){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			rw.cacheData[req.post.id]=req.post.o;
			rw.log.write('Cache Saved ['+req.post.id+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$i.saveced()'}),req,res);
			req=null;
			res=null;
			break;
		case 'savetc':
			if(!rw.config.backstage.switch.cache.edit){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			rw.tcache[req.post.id]=new Buffer(req.post.o,'base64').toString('utf8');
			rw.log.write('Template Cache Saved ['+req.post.id+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$i.savetced()'}),req,res);
			req=null;
			res=null;
			break;
		case 'delc':
			if(!rw.config.backstage.switch.cache.delete){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			delete rw.cacheData[req.post.id];
			rw.log.write('Cache Deleted ['+req.post.id+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$i.delced()'}),req,res);
			req=null;
			res=null;
			break;
		case 'deltc':
			if(!rw.config.backstage.switch.cache.delete){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			delete rw.tcache[req.post.id];
			rw.log.write('Template Cache Deleted ['+req.post.id+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$i.deltced()'}),req,res);
			req=null;
			res=null;
			break;
		case 'go':
			if(!rw.config.backstage.switch.code.list){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			req.post.path=rw.path.normalize(req.post.path);
			if(!rw.fs.existsSync(req.post.path)){
				rw.http.zout(JSON.stringify({'js':'$c.goNE()'}),req,res);
				req=null;
				res=null;
				return;
			}
			var f=false;
			try{
				f=rw.fs.readdirSync(req.post.path);
			}catch(e){
				
			}
			if(!f){
				rw.http.zout(JSON.stringify({'js':'$c.goND()'}),req,res);
				f=null;
				req=null;
				res=null;
				return;
			}
			var darr=[],farr=[],i,o;
			for(i in f){
				o=rw.fs.statSync(req.post.path+'/'+f[i]);
				if(o.isDirectory()){
					darr.push(f[i]);
				}else if(o.isFile()){
					farr.push({f:f[i],s:o.size});
				}
			}
			req.session.data['rouwan_path']=req.post.path;
			rw.http.zout(JSON.stringify({'js':'$c.god(json.darr,json.farr,json.cd,json.sep)','darr':darr,'farr':farr,'cd':req.post.path,'sep':rw.path.sep}),req,res);
			req=null;
			res=null;
			o=null;
			i=null;
			darr=null;
			farr=null;
			f=null;
			break;
		case 'gof':
			if(!rw.config.backstage.switch.code.view){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			req.post.f=rw.path.normalize(req.post.f);
			if(!rw.fs.existsSync(req.post.f)){
				rw.http.zout(JSON.stringify({'js':'$c.fnet()'}),req,res);
				req=null;
				res=null;
				return;
			}
			var re=rw.fs.readFileSync(req.post.f).toString('base64');
			rw.http.zout(JSON.stringify({'js':'$c.gofed(json.re,json.cf)','re':re,'cf':req.post.f}),req,res);
			re=null;
			req=null;
			res=null;
			break;
		case 'sf':
			if(!rw.config.backstage.switch.code.edit){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			req.post.f=rw.path.normalize(req.post.f);
			rw.fs.writeFileSync(req.post.f,new Buffer(req.post.o,'base64'));
			rw.log.write('File Saved ['+req.post.f+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$c.sfed()'}),req,res);
			req=null;
			res=null;
			break;
		case 'df':
			if(!rw.config.backstage.switch.code.delete){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			req.post.f=rw.path.normalize(req.post.f);
			rw.fs.unlinkSync(req.post.f);
			rw.log.write('File Deleted ['+req.post.f+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$c.dfed()'}),req,res);
			req=null;
			res=null;
			break;
		case 'nn':
			if(!rw.config.backstage.switch.code.create){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			req.post.nn=rw.path.normalize(req.post.nn);
			if(rw.fs.existsSync(req.post.nn)){
				rw.http.zout(JSON.stringify({'js':'$c.fet()'}),req,res);
				req=null;
				res=null;
				return;
			}
			rw.fs.writeFileSync(req.post.nn,'');
			rw.log.write('File Created ['+req.post.nn+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$c.nned(json.f)','f':req.post.nn}),req,res);
			req=null;
			res=null;
			break;
		case 'scup':
			if(!rw.config.backstage.switch.session.clean){
				rw.http.zout('{"js":"$m.locked()"}',req,res);
				req=null;
				res=null;
				return;
			}
			req.post.t=Number(req.post.t);
			var i,c=0,d=new Date().getTime();
			for(i in rw.session){
				if((d-rw.session[i].utime)>req.post.t){
					rw.session[i]=null;
					delete rw.session[i];
					c++;
				}
			}
			rw.log.write('Session Clean Up ['+c+'] ['+req.connection.remoteAddress+']','backstage');
			rw.http.zout(JSON.stringify({'js':'$i.scuped(json.c)','c':c}),req,res);
			req=null;
			res=null;
			break;
		case 'll':
			rw.http.zout(JSON.stringify({'js':'$i.lld(json.l)','l':rw.timeTag.list}),req,res);
			req=null;
			res=null;
			break;
		case 'llc':
			rw.timeTag.list=[{url:'Default',module:'default',time:0}];
			rw.http.zout(JSON.stringify({'js':'$i.llcd()'}),req,res);
			req=null;
			res=null;
			break;
		default:
			rw.http.throw(3,res);
			req=null;
			res=null;
	}
};

exports.run=function(req,res){
	if(req.method!='POST'){
		rw.http.throw(3,res);
		req=null;
		res=null;
		return;
	}
	rw.sess.start(req,res);
	rw.http.receivePostData(req,res,dataReceived);
};