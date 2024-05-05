# Project Estimation - CURRENT
Date:

Version: V1

## Estimation approach

Consider the EZElectronics  project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch

## Estimate by size

|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |             6                |             
|  A = Estimated average size per class, in LOC       |           250              | 
| S = Estimated size of project, in LOC (= NC * A) |              1500 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |                  150                    |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 4500 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |      1              |               

### Spiegazione delle stime di Estimate by size

Le classi che devono essere sviluppate sono solo quelle del controller e del DAO. Nelle classi del controller, abbiamo solo le firme dei metodi, mentre nelle classi DAO, abbiamo solo il nome della classe. La media di 250 LOC per classe è basata sul fatto che di solito un metodo ha 10/20 righe. Questa media considera anche le classi DAO che, essendo in media più lunghe, hanno contribuito ad aumentarla di una certa percentuale.

Basandoci poi sulla GUI sviluppata, una stima ottimale delle righe necessarie per svilupparla sono 4000(400phr), che portano il costo del lavoro a 16500 euro.

Considerando invece la documentazione sviluppata nel progetto invece si hanno 1070 righe di markdown, che equivalgono a 107hr e che portano il costo del progetto a 19710 euro.

## Estimate by product decomposition

|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| requirement document   | 40 |
| GUI prototype |20|
| design document |0|
| code |550|
| unit tests | 35 |
| api tests | 50 |
| management documents  | 10|

## Estimate by activity decomposition

|         Activity name    | Estimated effort (person hours)   |
| ---------------------------- | -------------------------------: |
|**Requirement document**    | **40** |
| --Review del sistema attuale| 5 |
| --Definizione stakeholders e context diagram| 6 |
| --Definizione interfacce e user stories| 4 |
| --Definizione requisiti funzionali e non funzionali| 9 |
| --Creazione diagramma dei casi d’uso e scenari| 8 |
| --Review del documento finale| 8 |
| **GUI prototype** |20|
| Review degli use case | 5 |
| Scelta del tool da utilizzare | 1 |
| Scelta del design system | 1 |
| Traduzione di use case in UI | 13 |
| **Code backend** |150|
| --Analisi dei metodi forniti in UserController| 10|
| --Creazione e completamento dei metodi nel UserDAO| 20|
| --Completamento dei metodi in UserController| 20|
| --Analisi dei metodi forniti in CartController| 10 |
| --Creazione e completamento dei metodi nel CartDAO| 20|
| --Completamento dei metodi in CartController| 20|
| --Analisi dei metodi forniti in ProductController| 10|
| --Creazione e completamento dei metodi nel ProductDAO| 20|
| --Completamento dei metodi in ProductController| 20 |
| **Code frontend**|440|
| --Progettazione dell'architettura| 40|
| --Setup dell'ambiente di sviluppo| 15|
| --Sviluppo dei componenti React| 200 |
| --Integrazione con il backend (PHP)| 50 |
| --Styling e design| 30 |
| --Testing| 15 |
| --Debugging e ottimizzazione: Variabile, ma considerando un 15% del tempo totale | 60 |
| --Deploy| 10 |
| **Unit tests** | 35 |
| --Identificazione dei metodi da testare|5|
| --Creazione dei test necessari|25|
| --Verifica del corretto funzionamento dei test|5|
| **api tests** | 50 |
| --Identificazione dei metodi da testare|5|
| --Creazione dei test necessari|40|
| --Verifica del corretto funzionamento dei test|5|
| **Management documents**  | 10 |

![](Immagini/gantt.png)

## Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|             | Estimated effort                        |   Estimated duration(settimane di lavoro del team di 4 persone, considerando 8h al giorno, per 5 giorni) |          
| ----------- | ------------------------------- | ---------------|
| estimate by size |657|4.1|
| estimate by product decomposition |705|4.4|
| estimate by activity decomposition |745|4.8|

Diverse metodologie di stima possono portare a risultati diversi a seconda di cosa viene considerato nel processo di valutazione, infatti l'approccio tra la prima sezione e le altre e' totalmente diverso.
Inoltre il livello di dettaglio porta a risultati simili, infatti by product e by activity sono simili, ma considerare le task nell'insieme puo' portare a una generalizzazione e quindi una riduzione delle ore.