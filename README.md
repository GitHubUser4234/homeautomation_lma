# Kostenlos den LMA mit Alexa nutzen
Hier sind ein Beispiel-Alexa-Skill und ein LMA-Parser zu finden, welche dabei helfen sollen, den LMA kostenlos mit Alexa zu nutzen. Warnung: Nur für Leute, die sich im Programmieren auskennen und Benutzung auf eigene Gefahr.

## Funktionsweise
Alexa-App mit privatem Alexa-Skill -> AWS Lambda -> Homeserver -> LMA

### Alexa-Skill
Ein eigener, privater Alexa-Skill muss auf AWS Lambda installiert werden. In der Alexa-App muss dieser dann aktiviert werden und kann, falls gewünscht, auch mit dem JBMedia-Skill simultan dort aktiv sein. Ein Beispiel-Alexa-Skill befindet sich im "skill"-Ordner.

### LMA-Parser
Der LMA-Parser generiert eine Liste der im LMA konfigurierten Aktoren und Szenen für die Alexa-Skill-Discovery und ein PHP-Array, welches die HTTP-Requests enthält. Die Generierung kann erfolgen, wenn man mit dem Browser auf den LMA zugegriffen hat und den Source-Code in den LMA-Parser kopiert hat. Der LMA-Parser sollte den eigenen Bedürfnissen angepasst werden. Ein Beispiel-LMA-Parser befindet sich im "parser"-Ordner.

### Homeserver
Der Homeserver muss in der Lage sein, dem Alexa-Skill auf Anfrage mitzuteilen, welche Aktoren und Szenen es gibt. Dazu verwendet er die entsprechende, vom LMA-Parser generierte, Liste. Ausserdem nimmt der Homeserver die Anweisungen vom Alexa-Skill entgegen, und findet u.a. mit der Endpoint-ID anhand der vom LMA-Parser generierten HTTP-Requests heraus, welcher Befehl an den LMA geschickt werden soll. Da hier kein Beispiel zur Verfügung gestellt werden kann, ist Eigeninitiative gefragt. Wichtig ist, immer Sicherheitsaspekte zu beachten, wie Authentifizierung, HTTPS-Protokoll etc.


## Vorteile
- Kostenlos (Im Rahmen des AWS Free-Tier-Kontingents)
- Alexa reagiert schneller, da kein Umweg über die JBMedia-Cloud erfolgt
- Man kann alle Möglichkeiten der Alexa-API nutzen und z.B. außer  Jalousie, Schalter oder Licht auch andere Controller-Arten wählen
- Volle Kontrolle wenn mal etwas nicht funktionieren sollte
