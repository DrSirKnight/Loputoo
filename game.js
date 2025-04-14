document.addEventListener("DOMContentLoaded", () => {
    const gridItems = document.querySelectorAll(".grid-item");
    const grid = document.querySelector(".grid-container");

    const answerItems = document.querySelectorAll(".answer");
    const answerConnections = document.querySelectorAll(".answer-connection");
    const answerWords = document.querySelectorAll(".answer-words");

    let selectedItems = [];
    let wordToConnection = new Map();
    let currentPuzzles = [];
    let solvedConnections = [];
    let i = 0;
    let tries = 4;

    const difficultyColours = new Map([[0, "#A8E6CF"],[1, "#FFD3B6"],[2, "#FF8B94"],[3, "#E84A5F"]]);
    let connectionDifficulty = new Map();

    let definitions;

    const popup = document.getElementById('popup');
    const closePopup = document.getElementById('close-popup');
    const wordPopup = document.getElementById('popup-word');
    const defPopup = document.getElementById('popup-def');

    wordDefinitionClick()

    fetch("puzzles.json")
        .then(response => response.json())
        .then(jsonData => processData(jsonData))
        .catch(error => console.error("Error loading JSON:", error));

    fetch("definitions.json")
        .then(response => response.json())
        .then(jsonData => definitions = jsonData)
        .catch(error => console.error("Error loading JSON:", error));

    // Processes json data
    function processData(data) {
        currentPuzzles = getRandomPuzzles(data, 4);

        // Sorts the puzzles by difficulty
        let sortedByDifficulty = [...currentPuzzles].sort((a, b) => a[2] - b[2]);
        sortedByDifficulty.forEach((puzzle, index) => {
            connectionDifficulty.set(puzzle[1], index);
        });

        wordToConnection.clear();
        solvedConnections = [];
        let wordList = [];

        currentPuzzles.forEach(puzzle => {
            const connectionName = puzzle[1];
            const words = puzzle[3];

            words.forEach(word => {
                wordToConnection.set(word, connectionName); // Word -> Connection mapping
                wordList.push(word);
            });
        });

        shuffle(wordList);
        gridItems.forEach((item, index) => {
            item.textContent = wordList[index];
        });

        // Sets up clicking for each item in the game grid
        gridItems.forEach(item => {
            item.addEventListener("click", () => {
                if (selectedItems.includes(item)) {
                    item.classList.remove("selected");
                    selectedItems.splice(selectedItems.indexOf(item), 1); // Removes the item at it's index
                } else if (selectedItems.length < 4) {
                    item.classList.add("selected");
                    selectedItems.push(item);
                }
            });
        });
    }

    function checkForConnection() {
        const selectedWords = selectedItems.map(item => item.textContent);
        const connections = selectedWords.map(word => wordToConnection.get(word));

        if (selectedWords.length < 4) return false;


        let bestConnection = "";
        let count = 0;

        for (const c of connections) {
            if (!c) continue;

            const currentCount = connections.filter(c2 => c2 == c).length;

            if (currentCount > count) {
                bestConnection = c;
                count = currentCount;
            }
        }

        if (count == 4) {
            selectedItems.forEach(item => item.remove());
            answerConnections[i].textContent = bestConnection + "\n";
            answerWords[i].innerHTML = selectedWords.map(word => `<span class="clickable-word">${word}</span>`).join(", ");
            answerItems[i].classList.add("correct");

            const difficultyRank = connectionDifficulty.get(bestConnection);
            answerItems[i].style.backgroundColor = difficultyColours.get(difficultyRank);

            solvedConnections.push(bestConnection);
            i++;
            grid.style.gridTemplateRows = `repeat(${4 - i}, 100px)`;
        } else {
            tries--;
        }

        if (tries != 0) {
            if (count == 3) {
                document.getElementById("threeright").style.display = "block";
            } else {
                document.getElementById("threeright").style.display = "none";
            }
        }

        selectedItems.forEach(item => item.classList.remove("selected"));
        selectedItems = [];
        return true;
    }

    document.getElementById('shuffle').addEventListener('click', function () {
        const remainingItems = Array.from(gridItems).filter(item => item.textContent && item.offsetParent != null);
        const remainingWords = remainingItems.map(item => item.textContent);
        shuffle(remainingWords);
        remainingItems.forEach((item, index) => {
            item.textContent = remainingWords[index];
            item.classList.remove("selected");
        });
        selectedItems.forEach(item => item.classList.remove("selected"));
        selectedItems = [];
    });

    document.getElementById('submit').addEventListener('click', function () {
        completeGuess();
    });

    if (document.getElementById('indexid') != null) {
        document.getElementById('share').addEventListener('click', function () {
            clipboard(`🟦⬛⬜ Ma leidsin ${i} ühendust ${i+4-tries} arvamisega tänases mängus! 🟦⬛⬜`)
        });
    } else {
        document.getElementById('share').addEventListener('click', function () {
            clipboard(`🟦⬛⬜ Ma leidsin ${i} ühendust ${i+4-tries} arvamisega suvalises mängus! 🟦⬛⬜`)
        });
    };

    closePopup.addEventListener('click', () => {
        popup.close();
    });

    async function clipboard(text) {
        await navigator.clipboard.writeText(text);
    }

    function completeGuess() {
        if (checkForConnection()) {
            document.getElementById('status').textContent = `Katseid alles: ${tries}`;
            if (solvedConnections.length == 4 || tries == 0) {
                gameEnd();
            }
        }
    }

    function gameEnd() {
        document.querySelector(".grid-container").style.display = "none";
        document.getElementById("status").style.display = "none";
        document.getElementById("shuffle").style.display = "none";
        document.getElementById("submit").style.display = "none";
        document.getElementById("end-game").classList.add("over");

        let index = i;
        currentPuzzles.forEach(group => {
            const connectionName = group[1];
            const words = group[3];

            if (!solvedConnections.includes(connectionName)) {
                gridItems.forEach(item => {
                    if (words.includes(item.textContent)) {
                        item.remove();
                    }
                });

                answerConnections[index].textContent = connectionName + "\n";
                answerWords[index].innerHTML = words.map(word => `<span class="clickable-word">${word}</span>`).join(", ");
                answerItems[index].classList.add("correct");

                const difficultyRank = connectionDifficulty.get(connectionName);
                answerItems[index].style.backgroundColor = difficultyColours.get(difficultyRank);

                index++;
            }
        });

        gridItems.forEach(item => {
            item.style.pointerEvents = "none";
        });

        document.getElementById("end-info").textContent = `Õigesti leidsid ${solvedConnections.length} ühendust!`;
    }

    function wordDefinitionClick() {
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("clickable-word")) {
                popup.showModal();
                wordPopup.textContent = `Sõna: ${e.target.textContent}`
                defPopup.textContent = `Definitsioon: ${definitions[e.target.textContent]}`
            }
        });
    }    

    // This shuffle function is taken from the following stack overflow post: https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed
    function shuffle(array, seed=Math.random()) {
        var m = array.length, t, i;
      
        // While there remain elements to shuffle…
        while (m) {
      
          // Pick a remaining element…
          i = Math.floor(random(seed) * m--);
      
          // And swap it with the current element.
          t = array[m];
          array[m] = array[i];
          array[i] = t;
          ++seed
        }
      
        return array;
      }
      
    function random(seed) {
        var x = Math.sin(seed) * 10000; 
        return x - Math.floor(x);
    }

    function getRandomPuzzles(array, count) {
        const copy = [...array];
        if (document.getElementById('indexid') != null) {
            const today = new Date();
            const todayTime = today.getDate() * 1000000 + today.getMonth() * 10000 + today.getFullYear();
            shuffle(copy, todayTime);
        } else {
            shuffle(copy)
        }
        let puzzles = copy.slice(0, count);
        let findPuzzle = false;
        let notFits = -1;
        while (findPuzzle) {
            findPuzzle = true;
            for (let i = 0; i < 4; i++) {
                let words = findPuzzle[i][3]
                for (let j = 0; j < 4; i++) {
                    if (i != j) {
                        for (word in words) {
                            if (puzzles[j].has(word)) {
                                notFits = i;
                                findPuzzle = false;
                            }
                        }
                    }
                }
            }
            puzzles.splice(notFits, 1);

        }
        return puzzles
    }
});
