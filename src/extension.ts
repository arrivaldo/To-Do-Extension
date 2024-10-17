import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel | undefined;
    const tasksKey = 'todoTasks';

    // Command to open the To-Do list
    const openToDoCommand = vscode.commands.registerCommand('todo.open', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.One);
        } else {
            panel = vscode.window.createWebviewPanel(
                'todo', // Internal identifier for the webview
                'To-Do List', // Title of the panel
                vscode.ViewColumn.One, // Editor column to show the panel in
                {
                    enableScripts: true, // Allow scripts in the webview
                    retainContextWhenHidden: true // Keep the webview loaded
                }
            );

            // Restore tasks from the global state
            let toDoItems = context.globalState.get<string[]>(tasksKey, []);

            // HTML content for the webview
            panel.webview.html = getWebviewContent(toDoItems);

            // Handle messages from the webview
			panel.webview.onDidReceiveMessage(
				(message) => {
					switch (message.command) {
						case 'addTask':
							toDoItems.push(message.text);
							context.globalState.update(tasksKey, toDoItems);
							panel!.webview.html = getWebviewContent(toDoItems); // Update UI
							break;
						case 'removeTask':
							toDoItems = toDoItems.filter((_, index) => index !== message.index);
							context.globalState.update(tasksKey, toDoItems);
							panel!.webview.html = getWebviewContent(toDoItems); // Update UI
							break;
						case 'editTask':
							toDoItems[message.index] = message.text; // Update the specific task
							context.globalState.update(tasksKey, toDoItems);
							panel!.webview.html = getWebviewContent(toDoItems); // Update UI
							break;
					}
				},
				undefined,
				context.subscriptions
			);
			

            panel.onDidDispose(() => {
                panel = undefined;
            });
        }
    });

    context.subscriptions.push(openToDoCommand);
}

// Function to generate the HTML for the webview
function getWebviewContent(toDoItems: string[]): string {
    const tasksHtml = toDoItems.map((item, index) => `
        <li class="task-item">
            <input type="checkbox" id="taskCheckbox-${index}" class="task-checkbox" />
            <span id="task-${index}" class="task-text">${item}</span>
            <input id="editInput-${index}" class="edit-input" style="display:none;" type="text" value="${item}" />
            <button id="editBtn-${index}" class="edit-btn" onclick="editTask(${index})">✏️</button>
            <button id="saveBtn-${index}" class="save-btn" style="display:none;" onclick="saveTask(${index})">💾</button>
            <button class="delete-btn" onclick="deleteTask(${index})">🗑️</button>
        </li>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>To-Do List</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px;
					color: #333;
					display: flex;
					align-items: center; 
					height: 100vh;
					width: 100vw;
					flex-direction: column;
                }
                h1 {
                    color: #eee;
                }
                input { 
                    margin-bottom: 10px; 
                    padding: 10px; 
                    width: 800px; 
                    // border: 1px solid #ccc;
                    border-radius: 5px;
					background: #313131;
					font-size: 16px;
					color: #eee;
					    outline: none; /* Remove focus outline */

                }

				input:focus {
    border: 1px solid transparent; /* Optionally make border transparent or keep it the same */
    box-shadow: none; /* Remove box shadow if any */
						    outline: none; /* Remove focus outline */

}
                button { 
                    padding: 10px 20px; 
                    margin-left: 5px; 
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
					background: #0077d4;
					color: #eee;
                }
                ul { 
                    list-style-type: none; 
                    padding-left: 0; 
                }
                li { 
                    margin-bottom: 15px; 
                    display: flex; 
                    align-items: center; 
                    padding: 10px;
                    border-radius: 5px;
					color:#eee;
                    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
                }
					  .task-checkbox {
                    margin-right: 10px; /* Space between checkbox and task text */
                    transform: scale(1.5); /* Increase size of checkbox for better visibility */
					width: 30px;
					    outline: none; /* Remove focus outline */

                }

				.task-checkbox:focus {
    outline: none; /* No outline on focus */
    box-shadow: none; /* No box shadow on focus */
}

				.input-container {
    display: flex; 
    align-items: center; 
	justify-content: center;
	height: 100px;
	width: 100%;
}
.add-btn {
    padding: 10px 20px; 
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background: #0077d4;
    color: #eee;
    font-size: 20px; /* Ensure consistent font size */
    display: flex; /* Use flex to align content within the button */
    align-items: center; /* Center icon inside button if any */
}


                .task-item:hover {
                    // background: #f9f9f9;
                }
                .task-text { 
                    display: inline-block; 
                    width: 250px; 
                    font-size: 16px; 
					color:#eee;
                }
                .edit-input { 
                    width: 200px; 
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
						color: eee;

                }
						.edit-btn {
												margin-left: 50px;

						}
                .edit-btn, .delete-btn, .save-btn {
                    background-color: #007acc; /* Blue color */
                    color: white;
                    padding: 5px 10px;
                    font-size: 14px;
                }
                .edit-btn:hover, .delete-btn:hover, .save-btn:hover {
                    background-color: #005f99; /* Darker blue on hover */
                }
                // .delete-btn {
                //     background-color: #e74c3c; 
                // }
                .delete-btn:hover {
                    background-color: #c0392b; 
                }
            </style>
        </head>
        <body>
            <h1>To-Do List</h1>
             <div class="input-container">
       			 <input id="taskInput" type="text" placeholder="New task" />
       			 <button class="add-btn" onclick="addTask()">+</button>
  			  </div>
            <ul id="taskList">${tasksHtml}</ul>

            <script>
                const vscode = acquireVsCodeApi();
                
                function addTask() {
                    const input = document.getElementById('taskInput');
                    if (input.value) {
                        vscode.postMessage({ command: 'addTask', text: input.value });
                        input.value = ''; // Clear input after adding

                    }
                    input.focus(); // Maintain focus on the input field

                }

                 document.getElementById('taskInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

                function deleteTask(index) {
                    vscode.postMessage({ command: 'removeTask', index });
                }

                function editTask(index) {
                    const taskElement = document.getElementById('task-' + index);
                    const inputElement = document.getElementById('editInput-' + index);
                    const editBtn = document.getElementById('editBtn-' + index);
                    const saveBtn = document.getElementById('saveBtn-' + index);

                    taskElement.style.display = 'none'; // Hide task text
                    inputElement.style.display = 'inline-block'; // Show input field
                    editBtn.disabled = true; // Disable edit button
                    saveBtn.style.display = 'inline-block'; // Show save button
                }

                function saveTask(index) {
                    const inputElement = document.getElementById('editInput-' + index);
                    if (inputElement.value) {
                        vscode.postMessage({ command: 'editTask', index, text: inputElement.value });
                    }
                }

				document.querySelectorAll('.task-checkbox').forEach((checkbox, index) => {
    checkbox.addEventListener('change', () => {
        const taskElement = document.getElementById('task-' + index);
        if (checkbox.checked) {
            taskElement.style.textDecoration = 'line-through'; // Mark as completed
        } else {
            taskElement.style.textDecoration = 'none'; // Remove completion mark
        }
    });
});
            </script>
        </body>
        </html>
    `;
}



export function deactivate() {}
