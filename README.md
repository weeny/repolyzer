# repolyzer
Analyzer for github projects

First, use the Oauth portal to authorize the app from your github account.
The app will save your Oauth token as a cookie so you don't have to re-authorize.

Click the green button to analyze this repository in the app.
Type in any Github repo in the form owner/reponame into the Project Name box.  
Then click Load to analyze it.

Commits are shown along the bottom of the screen.  
You can click on a commit to traverse to that commit.
You can also use the arrow keys on the top right to traverse first, previous, next and last commits.

Files in the commit visualizer are scaled based on their size in linex.  
New files are given a green outline while updated files are given a blue outline.
New files and files that get updated are brought to the top.
As files get further from their last commit, they "age" by shrinking and falling.
Files that are more active "age" more slowly.
