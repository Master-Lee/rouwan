rw.counter.new("example.test",10000);

exports.run=function(req,res){
	var data = {
		"title":"Hello World!",
		"hello":"This is a doT-template based page.",
		"why":{
			"Faster":
				"Test on JSPref <a href=\"http://jsperf.com/dot-js-vs-haml-vs-jade/7\">Jade vs Haml vs dot</a>",
			"Simple":
				"<code>&lt;div&gt;Hi {{=it.name}}!&lt;/div&gt;<br />&lt;div&gt;{{=it.age || ''}}&lt;/div&gt;</code>",
			"Get started":
				"Learn <a href=\"http://olado.github.io/doT/tutorial.html\">tutorial from author </a>."
		},
		"counter":Math.ceil(rw.counter.add("example.test",true)*1000),
		"serverHeader":rw.config.http.header.Server
	};
	rw.http.zout(
		rw.tpl.render(__dirname+"/../example/static/doTExample.html", data), req, res
	);
	req = null;
};