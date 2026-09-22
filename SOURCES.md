# Quellen und Datenprüfung

## Amtlicher Katalog

Fragetexte, Antwortmöglichkeiten und Abbildungen stammen aus dem BAMF-Gesamtfragenkatalog (Stand 07.05.2025):

https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.pdf?__blob=publicationFile

Die PDF-Seite ist pro Frage als `source_page` gespeichert. Die 43 Abbildungen sind Ausschnitte einschließlich Bildnummern. Bildnachweise und Rechte bleiben bei den ursprünglichen Rechteinhabern; das Repository erteilt keine zusätzlichen Rechte an diesen Abbildungen.

## Richtige Antworten

Alle 460 Zuordnungen wurden am 22.09.2026 gegen die als richtig markierten Antworten im offiziellen Onlinekatalog geprüft:

https://oet.bamf.de/ords/oetut/f?p=514:1::::::

Der Referenzschlüssel in `tests/fixtures/bamf-answer-key.json` enthält die separat abgerufenen richtigen Antworttexte. Deren Schreibweisen können vom PDF abweichen.

Für die anfängliche Gegenprüfung wurden außerdem die öffentlich sichtbaren Sammlungen `webmansa/german-citizenship-test-data` und `abdullahbutt/leben-in-deutschland-test` auf GitHub herangezogen. Ihre Übersetzungen, Erklärungen und Programmdateien werden nicht verwendet. Maßgeblich sind die amtliche PDF und das amtliche Onlineportal. Beim Abgleich wurden unter anderem Frage 163 (1938) und das Brandenburg-Wappen (Bild 1) korrigiert.

## Prüfungsformat

https://www.gesetze-im-internet.de/einbtestv/__1.html

33 Fragen, darunter drei Landesfragen, 60 Minuten und mindestens 17 richtige Antworten. Der zusätzliche 30-Fragen-Modus ist eine Übung ohne offizielle Bestehensbewertung.
