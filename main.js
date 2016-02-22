var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('electron').ipcMain;
var fs = require('fs');

//var filename = __dirname + '/notes.json';
var notesDir = __dirname + '/notes/';
var currFile = "";
var files = [];
var notes = [];

require('crash-reporter').start();

var notesWindow = null;
var quizWindow = null;

var write = function() {
	fs.writeFile(notesDir + currFile + '.json', JSON.stringify(notes), function(err) {
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

var loadFile = function(file, sender) {
	if (file != "New File") {
		currFile = file;
		var text = fs.readFileSync(notesDir + currFile + '.json');
		notes = JSON.parse(text);
		sender.send('file-loaded', {
			filename: currFile,
			notes: notes
		});
	}
	else {

	}
}

app.on('window-all-closed', function() {
	app.quit();
});

ipc.on('files', function(evt, arg) {
	fs.readdir(notesDir, function(err, f) {
		if (err) throw err;
		files = [];

		if (files.length == 0) {
			currFile = 'notes';
			fs.writeFile(notesDir + 'notes.json', "[]", function(err) {
				if (err) console.log(err);
			});
		}

		for (var k = 0; k < f.length; k++) {
			if (f[k] == '.DS_Store') continue;
			else {
				var fn = f[k];
				files.push(fn.slice(0, -5));
			}
		}

		evt.sender.send('files-list', files);

	});
});

ipc.on('rename', function(evt, arg) {
	fs.renameSync(notesDir + currFile + '.json', notesDir + arg + '.json');
	files[files.indexOf(currFile)] = arg;
	evt.sender.send('files-list', files);
	currFile = arg;
});

ipc.on('file', function(evt, arg) {
	loadFile(arg.file, evt.sender);
});

ipc.on('note', function(evt, arg) {
	if (arg.type == 'get') {
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
	quizWindow.loadURL('file://' + __dirname + '/views/quiz.html');
});

app.on('ready', function() {
	notesWindow = new BrowserWindow({width: 1000, height: 600});
	notesWindow.loadURL('file://' + __dirname + '/views/notes.html');

	notesWindow.on('closed', function() {
		notesWindow = null;
	});
});

