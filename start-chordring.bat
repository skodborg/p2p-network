start cmd /k "set PORT=2000 & set PORTSUCC=2002 & set PORTPRED=2004 & echo 2000 & npm start"
start cmd /k "set PORT=2002 & set PORTSUCC=2004 & set PORTPRED=2000 & echo 2002 & npm start"
start cmd /k "set PORT=2004 & set PORTSUCC=2000 & set PORTPRED=2002 & echo 2004 & npm start"