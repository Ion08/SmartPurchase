# Features Roadmap (Large Backlog)

Acest document contine o lista mare de functii care pot fi implementate in aplicatia SmartPurchase HoReCa.
Scop: idei concrete pentru MVP extins, roadmap pe 6-18 luni si feature prioritization.

## Cum sa folosesti lista

- Marcheaza fiecare item cu status: `todo`, `in-progress`, `done`, `won't do`.
- Adauga scor pentru fiecare feature: impact (1-5), efort (1-5), urgenta (1-5).
- Prioritizeaza primele sprinturi dupa formula simpla: `impact + urgenta - efort`.

## Implemented now (April 2026)

- [done] 30. Confidence interval (best/expected/worst case) in forecast chart.
- [done] 139. Data freshness indicator (forecast + dashboard).
- [done] 128. Saved views per utilizator (forecast filters).
- [done] 244. Top risk items panel (top 10 cu risk score).
- [done] 246. Confidence interval vizibil in chart si CSV export.
- [done] 3. Detectie duplicate la import.
- [done] 6. Istoric importuri cu audit trail.
- [done] 7. Rollback pentru import gresit.
- [done] 8. Validari schema inainte de ingestie.
- [done] 18. Data quality score per sursa (la import).
- [done] 19. Preview date inainte de confirmare.
- [done] 249. Approval simplu pentru comenzi mari.
- [done] 250. Activity log pe importuri si comenzi.
- [done] 26. Forecast ajustat dupa sarbatori.
- [done] 27. Forecast ajustat dupa evenimente locale.

## Roadmap complet (toate cele 260)

- Vezi documentul de executie complet: `ROADMAP_260_COMPLETE.md`.
- Board executabil: `ROADMAP_260_EXECUTION_BOARD.md`.
- Tracker CSV complet: `ROADMAP_260_TRACKER.csv`.

---

## 1) Import, Integrari, Data Pipelines

1. Import CSV cu mapare automata a coloanelor.
2. Salvare template-uri de import per furnizor.
3. Detectie duplicate la import.
4. Import incremental (doar randuri noi).
5. Import pe loturi mari cu progress bar.
6. Istoric importuri cu audit trail.
7. Rollback pentru import gresit.
8. Validari schema inainte de ingestie.
9. Detectie unitati inconsistente (kg vs g, l vs ml).
10. Conversie automata unitati.
11. Conector API pentru POS #1.
12. Conector API pentru POS #2.
13. Conector API pentru ERP #1.
14. Sync programat (cron) pentru surse externe.
15. Webhook endpoint pentru date realtime.
16. Retry queue pentru importuri esuate.
17. Notificare cand sursa externa e offline.
18. Data quality score per sursa.
19. Preview date inainte de confirmare.
20. Mapping inteligent pe baza importurilor trecute.

## 2) Forecasting si Predictive Intelligence

21. Forecast pe produs pe zi/saptamana/luna.
22. Forecast pe categorie de produse.
23. Forecast pe locatie (multi-unit).
24. Forecast cu sezonalitate automata.
25. Forecast ajustat dupa zi din saptamana.
26. Forecast ajustat dupa sarbatori.
27. Forecast ajustat dupa evenimente locale.
28. Forecast ajustat dupa meteo.
29. Forecast ajustat dupa promotii.
30. Confidence interval (best/expected/worst case).
31. Explicatii pentru forecast (feature importance).
32. Comparatie model curent vs model alternativ.
33. Backtesting pe date istorice.
34. MAPE/WAPE dashboard pentru acuratete.
35. Alertare cand acuratetea scade sub prag.
36. Auto recalibrare model lunar.
37. Forecast separat pentru produse volatile.
38. Simulare "ce se intampla daca" pentru cerere.
39. Sugestie stoc minim dinamic pe produs.
40. Forecast pentru produse noi (cold start logic).

## 3) Inventory Management

41. Evidenta stoc curent pe locatie.
42. Evidenta stoc in tranzit.
43. FIFO/FEFO enforcement.
44. Alerta stoc sub prag minim.
45. Alerta stoc peste prag maxim.
46. Alerta produse aproape de expirare.
47. Ajustari de inventar cu motiv obligatoriu.
48. Inventar periodic asistat (cycle counting).
49. Reconciliere automata stoc teoretic vs fizic.
50. Raport shrinkage (pierderi neexplicate).
51. Tracking lot/batch pentru trasabilitate.
52. Tracking furnizor per lot.
53. Tracking cost mediu ponderat per SKU.
54. Cost layer analysis pentru marfa intrata.
55. Transfer intern intre locatii.
56. Propuneri automate de transfer intern.
57. Alerta risc out-of-stock in X zile.
58. Simulare consum pana la urmatoarea livrare.
59. Auto split stoc blocat vs disponibil.
60. Dashboard health stoc (traffic light).

## 4) Smart Purchasing & Procurement

61. Sugestie comanda automata pe furnizor.
62. Grupare produse pe furnizor preferat.
63. Furnizor fallback daca principalul nu livreaza.
64. MOQ (minimum order quantity) validation.
65. Multipli de ambalare obligatorii.
66. Calendar comenzi pe zile de livrare.
67. Lead time tracking per furnizor.
68. SLA tracking livrare la timp.
69. Evaluare furnizor dupa pret + punctualitate.
70. Scor furnizor automat.
71. Negociere recomandata pe baza istoricului.
72. Simulare impact crestere pret furnizor.
73. Detectie anomalii de pret la achizitie.
74. Contract terms registry (discount, rebate).
75. Auto aplicare discounturi contractuale.
76. PO approval workflow (1-2 niveluri).
77. Limite de aprobare pe rol.
78. Blocare comanda peste buget fara aprobare.
79. Confirmare receptie partiala/completa.
80. Matching PO - receptie - factura.

## 5) Food Waste si Sustainability

81. Jurnal de risipa pe motiv.
82. Cost risipa zilnic/saptamanal/lunar.
83. Top produse cu cea mai mare risipa.
84. Top motive de risipa.
85. Alertare cand risipa depaseste prag.
86. Recomandari anti-risipa automate.
87. Sugestii de meniuri pentru stoc aproape expirat.
88. KPI "waste prevented" pe locatie.
89. KPI "waste cost recovered" prin promotii.
90. Conversie risipa in impact CO2 estimat.
91. Conversie risipa in apa economisita estimata.
92. Sustainability report exportabil PDF.
93. Badge intern "Green Performer" pe locatie.
94. Obiective eco lunare + progres.
95. Benchmark intern intre locatii.
96. Timeline initiative eco implementate.
97. Notificari pentru obiective eco ratate.
98. Recomandari de portion sizing.
99. Recomandari de redesign meniu anti-risipa.
100.  Campanii tematice "zero waste week".

## 6) Pricing, Profitability, Menu Engineering

101. Cost per reteta actualizat dinamic.
102. Cost per portie in timp real.
103. Margine bruta per preparat.
104. Margine bruta per categorie.
105. Elasticitate pret (estimata) pe produs.
106. Sugestie de pret optim per preparat.
107. Simulare impact discount asupra marjei.
108. Simulare schimbare gramaj asupra costului.
109. Detectie "star" vs "dog" in meniu.
110. Recomandari de pozitionare meniu.
111. Alertare cand marginea scade sub prag.
112. Top preparate dupa profit absolut.
113. Top preparate dupa profit procentual.
114. Analiza "menu mix" pe intervale.
115. Analiza "contribution margin".
116. Recomandari de bundling produse.
117. Recomandari de upsell/cross-sell.
118. Predictie profit pe urmatoarele 4 saptamani.
119. Profit bridge (volum vs pret vs cost).
120. Variance analysis plan vs actual.

## 7) Analytics, Dashboards, Insights

121. Dashboard executiv one-page.
122. Dashboard operational pe schimb/zi.
123. Dashboard procurement manager.
124. Dashboard finance controller.
125. Drill-down pe orice KPI.
126. Dimensiuni filtrare: locatie, categorie, furnizor.
127. Dimensiuni filtrare: interval orar, zi, saptamana.
128. Saved views per utilizator.
129. Shared views per echipa.
130. KPI definitions center.
131. Metric lineage (cum e calculata metrica).
132. Insights automate "what changed".
133. Weekly digest email cu insight-uri.
134. Alert center cu severitate.
135. Root cause suggestions pentru anomalii.
136. Benchmark luna curenta vs luna trecuta.
137. Benchmark YoY (year-over-year).
138. Forecast vs actual chart implicit.
139. Data freshness indicator.
140. Dashboard performance mode pentru date mari.

## 8) UX, Productivitate, Colaborare

141. Command palette in-app (shortcut actions).
142. Tastaturi rapide (keyboard shortcuts).
143. Onboarding ghidat pe rol.
144. Checklist setup initial business.
145. Tooltips contextuale inteligente.
146. Walkthrough pentru primul import.
147. Walkthrough pentru prima comanda.
148. Undo/redo pentru actiuni critice.
149. Bulk actions in tabele.
150. Coloane customizabile in tabele.
151. Pinned KPIs pe dashboard.
152. Notes per furnizor/produs/comanda.
153. Mentions (@user) in comentarii.
154. Task assignments din insight-uri.
155. In-app notifications center.
156. Notification preferences fine-grained.
157. Activity timeline per entitate.
158. Multi-language UI (RO/EN).
159. Accessibility improvements (a11y).
160. Mobile-optimized workflow pentru manager.

## 9) Security, Access, Compliance

161. RBAC avansat (roluri custom).
162. Permisiuni pe modul/actiune.
163. SSO (Google/Microsoft).
164. 2FA optional.
165. Session management avansat.
166. Audit logs complete.
167. IP allowlist optional.
168. Data encryption at rest note.
169. Data encryption in transit enforcement.
170. PII masking in UI.
171. GDPR data export per client.
172. GDPR right-to-be-forgotten workflow.
173. Retention policy configurabila.
174. Compliance checklist center.
175. Security alerts in admin panel.
176. Suspicious login detection.
177. API keys management.
178. Webhook secret rotation.
179. Fine-grained token scopes.
180. Tenant isolation hard checks.

## 10) Platform, DevEx, Reliability

181. Feature flags framework.
182. Experimentation/A-B testing framework.
183. Observability (logs, traces, metrics).
184. Error tracking centralizat.
185. Uptime dashboard intern.
186. Incident timeline si postmortem template.
187. Queue monitoring pentru joburi background.
188. Retry policies standardizate.
189. Circuit breaker pentru integrari externe.
190. Cache strategy documentata.
191. Rate limiting pe endpoint-uri.
192. API versioning strategy.
193. OpenAPI docs generate automat.
194. Contract tests pentru integrari.
195. End-to-end tests pentru flow-uri critice.
196. Synthetic monitoring pe pagini cheie.
197. Data migration safety checks.
198. Backup and restore playbook.
199. Blue/green deploy readiness.
200. Performance budget enforcement CI.

## 11) AI Copilot Features (in-app)

201. "Ask your data" chat assistant.
202. NL-to-query pentru analytics.
203. Rezumate automate ale performantelor saptamanale.
204. Insight explanations in limbaj simplu.
205. Auto-generated PO rationale.
206. Auto-generated supplier negotiation brief.
207. Anomaly detection narrative.
208. "Why did waste spike?" assistant.
209. "What should I order tomorrow?" assistant.
210. Smart scenario builder conversational.
211. Prompt templates per rol.
212. AI guardrails + citation of data sources.
213. Human approval required for high-risk actions.
214. AI confidence score per recomandare.
215. Feedback loop "helpful/not helpful".
216. AI personalizare pe business profile.
217. AI learn from accepted/rejected suggestions.
218. AI notes auto-tagging.
219. Voice input pentru manager in miscare.
220. Multilingual AI output control.

## 12) Monetization & Growth

221. Planuri tarifare pe volum/location.
222. Feature gating per plan.
223. Trial onboarding cu obiective clare.
224. In-app paywall elegant.
225. Usage meter in settings.
226. Upgrade prompts contextuale.
227. ROI calculator in-app.
228. Case study generator din date reale.
229. Referral program B2B.
230. Partner program pentru consultanti HoReCa.
231. White-label option (enterprise).
232. SLA tiers by plan.
233. Dedicated support add-on.
234. Premium analytics add-on.
235. API access as paid add-on.
236. Multi-location add-on.
237. ESG reporting add-on.
238. Procurement automation add-on.
239. Forecasting Pro add-on.
240. Revenue expansion dashboard.

## 13) Quick Wins (Implementare rapida, impact mare)

241. Alerta produse aproape de expirare.
242. Saved filters in dashboard.
243. Export CSV/PDF pentru rapoarte.
244. Top 10 produse cu risc de risipa.
245. Weekly email digest cu 5 insight-uri.
246. Confidence interval pe forecast chart.
247. Data freshness indicator global.
248. Sugestie comanda in 1 click.
249. Approval simplu pentru comenzi mari.
250. Activity log pe importuri si comenzi.

## 14) Moonshots (Diferentiere puternica)

251. Digital twin operational pentru fiecare locatie.
252. Simulare completa P&L in timp real.
253. Autonomous ordering cu human override.
254. Cross-location demand balancing automat.
255. Carbon-aware procurement optimizer.
256. Real-time menu reconfiguration engine.
257. Hyperlocal event demand graph.
258. Dynamic supplier marketplace scoring (fara marketplace tranzactional).
259. AI negotiation copilot live.
260. End-to-end "zero waste ops mode".

---

## Prioritizare recomandata (primele 3 sprinturi)

### Sprint 1 (fundatie date + valoare imediata)

- 1, 2, 9, 18, 35, 44, 46, 61, 83, 121, 139, 241.

### Sprint 2 (forecast robust + procurement inteligent)

- 24, 26, 28, 30, 33, 39, 64, 67, 69, 73, 76, 80.

### Sprint 3 (profit + sustainability + monetizare)

- 101, 103, 106, 111, 90, 92, 94, 221, 224, 227, 234, 239.

---

## Template simplu de evaluare feature

```md
Feature:
Owner:
Problema rezolvata:
Cine pierde bani daca lipseste:
Impact (1-5):
Efort (1-5):
Urgenta (1-5):
Dependinte:
MVP acceptance criteria:
KPI de succes:
```
