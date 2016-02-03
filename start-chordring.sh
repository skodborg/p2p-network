CURRDIR=`pwd`
osascript -e 'tell application "Terminal" to do script "echo 2000 & (cd '$CURRDIR'; PORT=2000 PORTSUCC=2002 PORTPRED=2004 npm start)"' &
osascript -e 'tell application "Terminal" to do script "echo 2002 & (cd '$CURRDIR'; PORT=2002 PORTSUCC=2004 PORTPRED=2000 npm start)"' &
osascript -e 'tell application "Terminal" to do script "echo 2004 & (cd '$CURRDIR'; PORT=2004 PORTSUCC=2000 PORTPRED=2002 npm start)"'