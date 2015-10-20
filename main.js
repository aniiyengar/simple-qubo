var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var fs = require('fs');

var filename = __dirname + '/notes.json';

fs.stat(filename, function(err, stat) {
	if (err == null) {
		fs.readFile(filename, function(err, data) {
			if (err) throw err;
			notes = JSON.parse(data);
		});
	}
	else {
		fs.writeFile(filename, "[]", function(err) {
			if (err) console.log(err);
		});
	}
});

var notes = [];

require('crash-reporter').start();

var notesWindow = null;
var quizWindow = null;

var write = function() {
	fs.writeFile(filename, JSON.stringify(notes), function(err) {
		if (err) throw err;
	});
}

var process = function(note) {

	if (note.answer.trim().length == 0 || note.clues.trim().length == 0) {
		return;
	}
	else {
		for (var i = 0; i < notes.length; i ++) {
			if (notes[i].answer.toLowerCase() == note.answer.toLowerCase()) {
				note.clues = notes[i].clues + '\n' + note.clues;
				note.answer = notes[i].answer;
				notes.splice(i--, 1);
			}
		}

		note.id = '' + Date.now();

		notes.unshift(note);
	}

}

app.on('window-all-closed', function() {
	app.quit();
});

ipc.on('note', function(evt, arg) {
	if (arg == 'get') {
		evt.sender.send('notes-clean', notes);
	}
	else {
		process(arg);
		write();
		evt.sender.send('notes-clean', notes);
	}
});

ipc.on('remove-note', function(evt, arg) {
	for (var i =0; i < notes.length; i++) {
		if (notes[i].id == arg) {
			notes.splice(i, 1);
			break;
		}
	}
	write();
	evt.sender.send('notes-clean', notes);
});

ipc.on('remove-clue', function(evt, arg) {
	for (var i = 0; i < notes.length; i++) {
		if (notes[i].id == arg.id) {
			var a = notes[i].clues.split('\n');
			a.splice(arg.ix, 1);
			if (a.length == 0) {
				notes.splice(i, 1);
			}
			else {
				notes[i].clues = a.join('\n');
			}
			break;
		}
	}
	write();
	evt.sender.send('notes-clean', notes);
});

ipc.on('start-quiz', function(evt, arg) {
	quizWindow = new BrowserWindow({width: 1000, height: 600});
	quizWindow.loadUrl('file://' + __dirname + '/views/quiz.html');
});

app.on('ready', function() {
	notesWindow = new BrowserWindow({width: 1000, height: 600});
	notesWindow.loadUrl('file://' + __dirname + '/views/notes.html');

	notesWindow.on('closed', function() {
		notesWindow = null;
	});
});

