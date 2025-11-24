
the format of ["contest"]["problems"] has been changed
- "short": "A", is the problem short name displayed on scoreboard header
- "name": "Access Points", is the full problem name displayed on problemset page, and also when choosing the problem in Submit the 選項 should be "<short> - <name>"
- "code": "accesspoints", is not used right now, but may be used in future for identifying the problem internally
- "color": "#FF0000", is the color used for displaying the problem on scoreboard header and elsewhere
- "border": "#bf0000", is the border color used for displaying the problem on scoreboard header and elsewhere

see json-format.json for reference, and set test.json be the default contest data

===

in Home page, the "rank" should reflect the current rank in scoreboard
the rank should show "?" instead of number when the scoreboard is frozen

after pressing submit button, navigate to Home page automatically

===

the two buttons are not working on the "DOMjudge" page as expected.
"export file" button should export the current contest data (including our team) as a new JSON file.
"copy to clipboard" button should copy the current contest data (including our team) to clipboard.

===

1. the buttons "export file" and "copy to clipboard" should be add to "DOMjudge" page instead of "Home" page.
2. the medals are not reflected on the scoreboard.

===

1. the three values in ["contest"]["medals"] specifies the number of gold, silver, bronze medalists. top places on scoreboard should have the respective medal.
2. add two buttons to the home page: "export file" and "copy to clipboard"
3. the background value of Paste contest JSON should be compacted test.json.

===

please update the pending logic, the submission submitted by the team itself should not be pending for 30 second

small fix: rename compile-error to compiler-error

===

should there be a resultSelect in populateModalOptions? if not, please explain the logic how you store the result. also, please remove unused files such as submit.html and
submit.js (if they are actually used, please tell me where and at what scene). also, why does every non-correct result become wrong-answer? also, the submissions should be
sorted in reverse order of time

===

in the home page, submission and clarification should take left and right side 50/50 respectively, and under the clarifications should be clarification requests. See TUMbling - DOMjudge.html for understanding

- div row
    - div col
        - teamoverview Submissions
        - table
    - div col
        - teamoverview Clarifications
        - table
        - teamoverview Clarification Requests

the scoreboard is not a card

see Contest problems nwerc18 - DOMjudge.html for what problemset should look like

the language in submit should be one of "C", "C++", "Java", "Python", "Kotlin"
the status in submit should be one of "correct", "wrong-answer", "timelimit", "run-error", "compile-error", "no-output", "output-limit", "rejected"

