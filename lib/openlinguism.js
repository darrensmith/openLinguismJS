function openLinguismClass(){
	console.log('Instantiating openLinguism');
    return this;
}

openLinguismClass.prototype.database = {};

openLinguismClass.prototype.fireEvent = function(eventName){
	var event;
	if (document.createEvent) {
		event = document.createEvent("HTMLEvents");
		event.initEvent(eventName, true, true);
	} else {
		event = document.createEventObject();
		event.eventType = eventName;
	}
		event.eventName = eventName;
	if (document.createEvent) {
		document.dispatchEvent(event);
	} else {
		document.fireEvent("on" + event.eventType, event);
	}
}

openLinguismClass.prototype.loadJSON = function(url,callback) {   
    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true); 
    xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {
			callback(xobj.responseText);
		}
    };
    xobj.send(null);  
 }

openLinguismClass.prototype.loadDBFromURL = function(url){
	self = this;
	this.loadJSON(url,function(text){
		self.database = JSON.parse(text);
		self.fireEvent('dbloaded');
	});
}

openLinguismClass.prototype.loadDBFromString = function(string){
	self.database = JSON.parse(string);
	self.fireEvent('dbloaded');
}

openLinguismClass.prototype.fetchDBClient = function(type){
	var filename = 'database.json'
	var jsonData = JSON.stringify(this.database);
	console.log(this.database);
	console.log(jsonData);
	if(type == "nativejs"){
		jsonData = "openLinguism.prototype.database = " + jsonData;
	}
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonData));
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

openLinguismClass.prototype.fetchJSON = function(){
	return this.database;
}

openLinguismClass.prototype.addWord = function(word){
	var upperCaseWord = word.toUpperCase();
	if(this.database.WORDS[upperCaseWord]){
		return false;
	} else {
		this.database.WORDS[upperCaseWord] = [];
		return true;
	}
}

openLinguismClass.prototype.removeWord = function(word){
	var upperCaseWord = word.toUpperCase();
	if(this.database.WORDS[upperCaseWord]){
		delete this.database.WORDS[upperCaseWord];
		return true;
	} else {
		return false;
	}
}

openLinguismClass.prototype.addCategory = function(category){
	var upperCaseCategory = category.toUpperCase();
	var categoryExists = false;
	for (var i = 0; i < this.database.CATEGORIES.length; i++) {
		if(this.database.CATEGORIES[i] == upperCaseCategory){
			categoryExists = true;
			return false;
		}
	}
	this.database.CATEGORIES.push(upperCaseCategory);
	return true;
}

openLinguismClass.prototype.removeCategory = function(category){
	var upperCaseCategory = category.toUpperCase();
	var categoryExists = false;
	for (var i = 0; i < this.database.CATEGORIES.length; i++) {
		if(this.database.CATEGORIES[i] == upperCaseCategory){
			categoryExists = true;
			delete this.database.CATEGORIES[i];
			return true;
		}
	}
	return false;
}

openLinguismClass.prototype.addCategoryToWord = function(word,category){
	var upperCaseWord = word.toUpperCase();
	var upperCaseCategory = category.toUpperCase();
	var categoryExists = false;
	if(this.database.WORDS[upperCaseWord]){
		for (var i = 0; i < this.database.WORDS[upperCaseWord].length; i++) {
			if(this.database.WORDS[upperCaseWord][i] == upperCaseCategory){
				categoryExists = true;
				return false;
			}
		}
		this.database.WORDS[upperCaseWord].push(upperCaseCategory);
		return true;
	} else {
		return false;
	}
}

openLinguismClass.prototype.removeCategoryFromWord = function(word,category){
	var upperCaseWord = word.toUpperCase();
	var upperCaseCategory = category.toUpperCase();
	var categoryExists = false;
	if(this.database.WORDS[upperCaseWord]){
		for (var i = 0; i < this.database.WORDS[upperCaseWord].length; i++) {
			if(this.database.WORDS[upperCaseWord][i] == upperCaseCategory){
				categoryExists = true;
				delete this.database.WORDS[upperCaseWord][i];
				return true;
			}
		}
		return false;
	} else {
		return false;
	}	
}

/* Adaptations to algorithm:
	x. Count words and increase counts for categories that words belong to
	x. If a negative word preceeds another, discard the following words counts
	x. Negative and positive cancel each other out
	x. Remove punctuation prior to analysing a word
	x. Look for patterns
*/

openLinguismClass.prototype.analyseTextBlock = function(textBlock){
	var negativeFlag = false;
	var textArray = textBlock.split(" ");
	var categoryResponse = {};
	if(this.database.CATEGORIES.length != 0){
		for (var i = 0; i < this.database.CATEGORIES.length; i++) {
			categoryResponse[this.database.CATEGORIES[i]] = 0;
		}		
	}

	// Loop through words in text block
	if(textArray.length != 0){
		for (var i = 0; i < textArray.length; i++) {
			var upperCaseWord = textArray[i].toUpperCase();

			// Remove punctuation from word
			upperCaseWord = upperCaseWord.replace(/\b[-.,()&$#!\[\]{}"']+\B|\B[-.,()&$#![\]{}"']+\b/g,"");

			if(negativeFlag)
				negativeFlag = false;
			else if(this.database.WORDS[upperCaseWord]){
				if(this.database.WORDS[upperCaseWord].length != 0){
					for (var j = 0; j <= this.database.WORDS[upperCaseWord].length; j++) {
						categoryResponse[this.database.WORDS[upperCaseWord][j]]++;
						if(this.database.WORDS[upperCaseWord][j] == "NEGATIVE")
							negativeFlag = true;
					}
				}
			}
		}
	}

	// Cancel out positives and negatives
	if(categoryResponse["NEGATIVE"] >= 1 && categoryResponse["POSITIVE"] >= 1){
		if(categoryResponse["NEGATIVE"] == categoryResponse["POSITIVE"]){
			categoryResponse["NEGATIVE"] = 0;
			categoryResponse["POSITIVE"] = 0;
		} else if(categoryResponse["NEGATIVE"] > categoryResponse["POSITIVE"]){
			categoryResponse["NEGATIVE"] = categoryResponse["NEGATIVE"] - categoryResponse["POSITIVE"];
			categoryResponse["POSITIVE"] = 0;			
		} else if(categoryResponse["NEGATIVE"] < categoryResponse["POSITIVE"]){
			categoryResponse["POSITIVE"] = categoryResponse["POSITIVE"] - categoryResponse["NEGATIVE"];
			categoryResponse["NEGATIVE"] = 0;	
		}
	}

	return categoryResponse;
}

// Instantiate a new object of the openLinguismClass class
var openLinguism = new openLinguismClass();