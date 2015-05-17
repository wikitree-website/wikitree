# Contributing to Wikitree

##### The Rules:
1. No pushes to upstream/master
2. Flattened commit history (rebase and squash)
3. No merging own code
4. Code review before production merge

##### Process:
When you want to add a new feature:

1) Fork wikitree-website/wikitree on your GitHub account and clone your fork
```
git clone https://github.com/<your_username>/wikitree
```

2) Add wikitree-website/wikitree as upstream remote repository.  This way, you can
grab changes as they are merged into production
```
git remote add upstream https://github.com/wikitree-website/wikitree.git
```

3) Make a branch to work on your feature
```
git checkout -b <branch_name>
```

4) Work as you normally would in your fork.  When you are finished, update your fork's copy of master
```
git fetch upstream
git checkout master
git merge upstream/master
```

5) Then, **rebase** your branch's changes on top of your fork's master
```
git checkout <branch_name>
git rebase master
git checkout master
git merge --squash <branch_name>
git commit -m "Commit message for entire branch" <list_of_files | --all>
```

At this point, it will only look like a **single commit** has been applied on top of
master: the feature you developed.

6) When you are satisfied with your work, open a pull request on GitHub on wikitree-website/wikitree comparing your fork's `wikitree:master` with `wikitree-website/wikitree:master`.

7) Get together with another developer and have them review your code.  When they sign off on it, they will merge your code in and **both of you** will be responsible for the code.  The merge can be done in pull request's comment section next to the build status.

8) Kick your feet up and crack open a cold one.
