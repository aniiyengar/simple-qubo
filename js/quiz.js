var ipc = require('ipc');
var list = [];

// JARO-WINKLER STRING DISTANCE
eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('n=g(5,6){8 f=5.h,c=6.h,e=t.s(f,c)/2-1,a=0,7=0,9=\'\';q(8 i u 6){9=6[i];b(5.j(i,i+e).k(9)>-1){7++}o b(5.j(i-e,i).k(9)>-1){7++;a++}};r(1/3*(7/f+7/c+(7-a)/7))};w=g(5,6,p){5=5.m();6=6.m();p=p||0.1;8 d=n(5,6),l=0;q(8 i=0;i<4;i++){b(5[i]==6[i]){l++}o{v}}r d+(l*p*(1-d))};',33,33,'|||||str1|str2|matches|var|letter|transpositions|if|lenStr2|dj|matchWindow|lenStr1|function|length||slice|indexOf||toLowerCase|jaro|else||for|return|max|Math|in|break|jaroWinkler'.split('|'),0,{}));

var resizeElements = function() {
	$("#quiz").css("top", $(window).height()/2 - 150 + "px");
}

var game, done, currQ, currA, numRight, numWrong, currPos, table;

var AssocTable = function(keyvals) {
	this.vals = keyvals;

	this.keyValueStore = function() {
		var r = {};
		for (var i = 0; i < this.vals.length; i+=2) {
			r[this.vals[i]] = this.vals[i+1];
		}
		return r;
	};
	this.removeItem = function(pos) {
		this.vals.splice(pos*2, 2);
	};
	this.keyAt = function(pos) {
		return this.vals[pos*2];
	};
	this.valueAt = function(pos) {
		return this.vals[pos*2+1];
	};
	this.valueForKey = function(key) {
		return this.keyValueStore()[key];
	};
	this.size = function() {
		return Object.keys(this.keyValueStore()).length;
	}
}


ipc.on('notes-clean', function(arg) {
	var l = [];
	for (var i = 0; i < arg.length; i++) {
		var note = arg[i];
		var clues = note.clues.split('\n');
		for (var j = 0; j < clues.length; j++) {
			l.push(clues[j]);
			l.push(note.answer);
		}
	}
	list = l;

	if (!game) {
		game = true;
		$("#submit").text("Submit");
		$("#ans").removeAttr("disabled").focus();
		game = false;
		done = false;
		currQ = "";
		currA = "";
		numRight = 0;
		numWrong = 0;
		currPos = 0;
		table = new AssocTable(list);
		populate();
	}
	else verify();
});

$(window).resize(resizeElements);
resizeElements();

var populate = function() {

	if (table.size() == 0) {
		game = false;
		$("#question p.q").html("Done! You got:<br/>" + numRight + "/" + (numRight+numWrong) + ", or " + Math.floor((numRight+0.0)/(numRight+numWrong)*100) + "%<br/>Refresh to go again.");
		$("#ans").val("");
	}
	else {
		currPos = Math.floor((Math.random() * table.size()));
		currQ = table.keyAt(currPos);
		currA = table.valueAt(currPos);
		$("#question p.q").text(currQ);
		$("#ans").val("");
	}

}

var verify = function() {
	var str = $("#ans").val();

	if (jaroWinkler(str, currA) > 0.85) {
		// Answer is correct
		numRight++;
		$("#feedback p").text("Correct! The correct answer was " + currA);
		$("#feedback p").css({
			"color" : "green"
		});
		table.removeItem(currPos);
	}
	else {
		numWrong++;
		$("#feedback p").text("Incorrect! The correct answer was " + currA);
		$("#feedback p").css({
			"color" : "red"
		});
	}

	$("#label-question").text("Question #: " + (numWrong+numRight));
	$("#label-correct").text("Correct #: " + (0+numRight));
	$("#label-incorrect").text("Incorrect #: " + (numWrong+0));
	$("#label-percentage").text("Percentage: " + Math.floor((numRight+0.0)/(numRight+numWrong)*100) + "%");

	populate();

}

$("#submit").click(function() {

	ipc.send('note', 'get');

});

document.onkeydown = function(evt) {
	if ($(":focus").attr("id") == "ans" && evt.keyCode == 13) {
		verify();
	}
}