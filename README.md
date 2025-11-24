## Instructions for AI (Codex / Code Generator)

You are an assistant that continues this project.

請為 html、css、js 都開一個資料夾，並把相關檔案放進去。
請不要修改 example 資料夾內的任何檔案，也不要引用該資料夾內的檔案。需要的話請自行複製一份到新的資料夾內。

- 應該包含多個網頁：
    - DOMjudge : （放在外面的 index.html）主頁面，可以在此執行的操作有
        - 輸入隊名以及學校名稱
        - 選擇比賽開始時間
        - import 比賽內容（包含題數、記分板、題本連結等等）
    - Home : 顯示個人得分及提交情況（請查看 example 下的 TUMbling - DOMjudge）
    - Problemset : 顯示題目列表（請查看 example 下的 Contest problems nwerc18 - DOMjudge）
        - submit、statement、samples 點下後都會跳轉到連結，先全部設定為 dummy 連結
        - 不需要 clarifications
    - Print : 列印介面（請查看 example 下的 Print - DOMjudge）
        - 能夠選擇檔案以及語言，但在按下 Print code 按鈕時請跳轉至 example 下的 DOMjudge - Print 錯誤頁面
    - Scoreboard : 顯示所有隊伍的得分情況（請查看 example 下的 Scoreboard nwerc18 - DOMjudge）
        - 請將 title 的 card "NWERC 2018" （比賽名稱）做成 drop down 式，點下後會展開 replay 的各種選項
        - 包含剛剛實作的 play/pause、seconds per tick、ticks per second、Freeze ON/OFF
        - 需要包含 "自己" 的隊伍，以 highlight 顯示該 row
    - Submit : 按下後提供選擇題目以及結果的選項
        - Problem : drop down list "Select a problem", 選項是 X - <problem X name>
        - Result : drop down list "Select a result", 選項是綠色的 Correct 跟紅色的 Rejected
        - 按下之後會記錄該次提交時間戳以及結果，並更新 Home 頁面的資訊以及記分板的資訊
    - Enable Notifications / Logout 等等按鈕都不需要實作功能，點下後皆跳轉回 Home
    - 右上角時間請顯示比賽剩餘時間，格式為 HH:MM:SS
        - 如果比賽已經結束或還沒設定開始時間，右上角時間請顯示 contest over
        - 如果比賽已經設定開始時間且尚未開始，右上角時間請顯示 HH:MM:SS to contest start
- 所有資訊請暫存在 local storage，重新整理網頁後資訊不會消失
- 請先使用 example 中前 12 名隊伍的資料來顯示 Scoreboard 頁面
