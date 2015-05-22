exports.validate=function(m,o){
	var i,re=[];
	for(i in m){
		if(m[i].must && typeof(o[i])=="undefined"){
			re.push(m[i].fail);
		}
	}
	for(i in o){
		if(m[i]){
			if(m[i].email){
				if(!rw.util.isEmail(o[i])){
					re.push(m[i].fail);
					continue;
				}
			}
			if(m[i].safe){
				o[i]=rw.util.safe(o[i]);
			}
			if(m[i].safereg){
				o[i]=rw.util.safeReg(o[i]);
			}
			if(m[i].lowercase){
				o[i]=o[i].toLowerCase();
			}
			if(m[i].uppercase){
				o[i]=o[i].toUpperCase();
			}
			if(m[i].reg){
				if(!m[i].reg.test(o[i])){
					re.push(m[i].fail);
					continue;
				}
			}
			if(m[i].type){
				if(m[i].type=='number'){
					o[i]=Number(o[i]);
					if(isNaN(o[i])){
						re.push(m[i].fail);
						continue;
					}
				}
				if(typeof(o[i])!=m[i].type){
					re.push(m[i].fail);
					continue;
				}
				if(m[i].type=='number' && m[i].value){
					if(o[i]<m[i].value[0] && m[i].value[0]!='open'){
						re.push(m[i].fail);
						continue;
					}
					if(o[i]>m[i].value[1] && m[i].value[1]!='open'){
						re.push(m[i].fail);
						continue;
					}
				}
			}
			if(m[i].length){
				if(m[i].length[0]!=0){
					if(o[i].length<m[i].length[0]){
						re.push(m[i].fail);
						continue;
					}
				}
				if(m[i].length[1]!=0){
					if(o[i].length>m[i].length[1]){
						re.push(m[i].fail);
						continue;
					}
				}
			}
			if(m[i].inarr){
				if(m[i].inarr.indexOf(o[i])<0){
					re.push(m[i].fail);
					continue;
				}
			}
		}
	}
	m=null;
	o=null;
	i=null;
	return re;
	re=null;
};