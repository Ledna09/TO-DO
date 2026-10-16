// Alaplista a "Teendők listája – fontossági sorrendben" (2026. október 14.) PDF alapján.
// Típus: "F" = folyamatos (zöld), "E" = egyszeri (piros). A harmadik érték 1, ha (új) pont.
window.SEED = {
  categories: [
    {
      name: "Foglalások kezelése",
      note: "Közvetlenül ettől függ a bevétel és a napi működés.",
      tasks: [
        ["Telefonon leadott foglalások azonnali felvitele a weboldalra (egységes foglalási rendszer)", "F", 0],
        ["Státuszok kezelése a WP-Admin felületen (Függőben / Elfogadva stb.)", "F", 0],
        ["Foglalási naptár napi ellenőrzése: ütközések, dupla foglalások kiszűrése", "F", 1],
        ["Emlékeztető üzenet kiküldése a kliensnek a foglalás előtt 1 nappal / 1 órával", "F", 0],
        ["Az emlékeztető és a visszaigazoló üzenetek automatizálása (HU/RO sablonokkal)", "E", 1],
        ["Lemondási és no-show szabályzat kidolgozása (előleg, lemondási határidő)", "E", 1],
        ["Havi LTG/Escape foglalások monitorizálása", "F", 0],
        ["Helyszíni operatív működés: vendégek üdvözlése, foglalás azonnali ellenőrzése („Bine ați venit!”, „Știm că aveți o rezervare de la…”)", "F", 0],
        ["Egységes üdvözlő szkript írása és a csapat betanítása", "E", 1],
        ["Lemondás esetén várólista kezelése, a felszabadult időpontok gyors újraértékesítése", "F", 1],
        ["Nyílt esték / napok (walk-in) kipróbálása – pilot, majd kiértékelés", "E", 0]
      ]
    },
    {
      name: "Előkönyvelés / könyvelés",
      note: "Jogi és adózási kötelezettség, a késés bírsággal jár. Az adózási pontokat egyeztesd a könyvelővel.",
      tasks: [
        ["Könyvelő kijelölése / szerződés felülvizsgálata: mi tartozik a könyvelőre, mi a cégre, kapcsolattartó és elérhetőség", "E", 0],
        ["Határidőnaptár a könyvelővel: havi és negyedéves bevallások, bérszámfejtés, éves zárás – minden határidő a közös naptárban", "E", 0],
        ["Felelős kijelölése az előkönyvelésre (ki gyűjti, ki küldi a dokumentumokat)", "E", 0],
        ["Minden bejövő számla és bizonylat összegyűjtése, beszkennelése/lefényképezése és rendezett mappába mentése", "F", 0],
        ["Dokumentumok havi leadása a könyvelőnek az egyeztetett határidőig (számlák, kivonatok, pénztárjelentés)", "F", 0],
        ["Kimenő számlák kiállítása minden foglalásról és voucherről, időben, helyes adatokkal (e-Factura kötelezettség ellenőrzése)", "F", 0],
        ["Napi pénztárzárás: készpénz és kártya bevétel egyeztetése a pénztárgép/POS és a foglalások adataival", "F", 0],
        ["Készpénzes és kártyás bevételek külön nyilvántartása (a statisztikához is kell)", "F", 0],
        ["Pénztárnapló vezetése és a pénztárkészlet heti ellenőrzése", "F", 0],
        ["Bankkivonatok havi egyeztetése a számlákkal: kifizetetlen vagy hiányzó tételek jelzése", "F", 0],
        ["Kintlévőségek követése: céges és csapatépítős ügyfelek fizetési határidejei, emlékeztetők", "F", 0],
        ["Szállítói számlák fizetési határidejeinek követése, fizetési ütemterv", "F", 0],
        ["Beszerzési számlák egyeztetése a készletnyilvántartással (Beszerzés kategória)", "F", 0],
        ["Előleg- és voucher-bevételek helyes könyvelése: a beváltásig nem teljesített szolgáltatás, egyeztetés a könyvelővel", "E", 0],
        ["Bérszámfejtés előkészítése: ledolgozott órák és beosztások havi leadása a könyvelőnek", "F", 0],
        ["Alkalmazottak és külsős segítők szerződéseinek, dokumentumainak rendben tartása", "F", 0],
        ["Eszközleltár: vestek, fegyverek, berendezések nyilvántartása beszerzési értékkel (értékcsökkenéshez)", "E", 0],
        ["Havi költség- és bevételösszesítő a vezetésnek (a Statisztika kategória alapja)", "F", 0],
        ["Adófizetési kötelezettségek és határidők előzetes ellenőrzése, a szükséges összeg félretétele", "F", 0],
        ["Negyedéves egyeztetés a könyvelővel: eredmény, adóhelyzet, várható kötelezettségek", "F", 0],
        ["Éves zárás előkészítése: leltár, elszámolások, hiányzó bizonylatok pótlása", "E", 0],
        ["Dokumentumok archiválása és megőrzési idők betartása (digitális biztonsági mentéssel)", "F", 0],
        ["Fizetésrendszer újraalkotása", "E", 0]
      ]
    },
    {
      name: "Árajánlatok / meghívók / szerződések / voucherek",
      note: "Az új csomagok és a szerződéses háttér nélkül nem indulhat el a marketing és az értékesítés.",
      tasks: [
        ["Contract cadru aktualizálása és nyelvtani ellenőrzése", "E", 0],
        ["Contract cadru aláíratása minden foglalásnál – akkor is, ha Zsófi nincs jelen", "F", 0],
        ["Új ajánlatok véglegesítése és piacra dobása: Netflix Copii, Netflix Adulți, Treasure Hunt", "E", 0],
        ["Weboldal: új csomagok bevezetése", "E", 0],
        ["Weboldal: csomagnevek átírása az újakra", "E", 0],
        ["Meghívó-sablonok elkészítése (születésnap, Halloween Edition, céges)", "E", 1],
        ["B2B ajánlatsablon cégeknek (csapatépítés, stress management, problem solving)", "E", 1],
        ["Voucher-szabályzat és sablon elkészítése (érvényesség, felhasználás feltételei)", "E", 1],
        ["Kiadott és beváltott voucherek nyilvántartása", "F", 1],
        ["Árak és csomagok éves felülvizsgálata", "F", 1]
      ]
    },
    {
      name: "Marketing",
      note: "Élményalapú marketing; a legsürgősebb az okt. 16–18-i iris fotós esemény.",
      tasks: [
        ["Iris fotós esemény (okt. 16–18) promóciója: teaser, bejelentő és emlékeztető videó; ingyenes iris fotó minden születésnapi eseményhez", "E", 1],
        ["Halloween Edition esemény meghirdetése és lebonyolítása", "E", 0],
        ["Rövid videók gyártása (heti 3–4): vicces pillanatok, fail compilation, POV, reakció, oktató, kulisszák mögött, high score kihívás, corporate teambuilding gone wrong; kereskedelmi használatra engedélyezett, trendi hangokkal", "F", 0],
        ["Videószkriptek írása a forgatásokhoz", "F", 0],
        ["Google értékelések növelése és gyors válasz minden értékelésre", "F", 0],
        ["Minden csapat a marketingesünk: helyszíni csoportfotó azonnali elküldése, megjelölés és Google értékelés kérése", "F", 0],
        ["Facebook giveaway-ek és versenyek", "F", 0],
        ["Tematikus Edition események (Parents vs. Kids stb.) tervezése és megtartása – használjuk az „Edition” szót", "F", 0],
        ["Éves Edition-naptár és havi tartalomterv összeállítása", "E", 1],
        ["AI-alapú személyes highlight videó, vicces fotók és statisztika a játék végén (egy kattintással megosztható)", "E", 0],
        ["AI-alapú személyre szabott remarketing beállítása (pl. Câștigă o petrecere, Mens sana kampányok)", "E", 0],
        ["Ranglisták, diák- és céges bajnokságok elindítása", "E", 0],
        ["B2B játékcsomagok kidolgozása: Stress Management Game, Tactical Team Work Simulation, Problem Solving Challenge", "E", 0],
        ["Kombinált élmények: LTG + Escape, LTG + Treasure Hunt, QR-kód küldetések, digitális achievement rendszer", "E", 0],
        ["Mikroinfluencer lista összeállítása és kapcsolatfelvétel", "E", 0],
        ["AI SEO és weboldal-optimalizálás", "E", 0],
        ["Ajánlói program kidolgozása (hozz egy barátot kedvezmény)", "E", 1],
        ["Google Cégprofil karbantartása (fotók, nyitvatartás, aktuális ajánlatok)", "F", 1],
        ["Marketing költségek és csatornák eredményének havi követése", "F", 1]
      ]
    },
    {
      name: "Beszerzés",
      note: "Folyamatos felügyeletet igényel, ezért felelős és egy belső rendszer kell hozzá (lásd a Beszerzés fület).",
      tasks: [
        ["Felelős kijelölése a beszerzésre", "E", 0],
        ["Kiinduló inventár készítése mindenről", "E", 0],
        ["Belső nyilvántartó rendszer (táblázat vagy frissíthető app) kialakítása", "E", 0],
        ["Minimum készletszintek (újrarendelési pont) meghatározása", "E", 1],
        ["Eseményre beszerzés: ropi, ásványvíz, sima víz, natúr és buborékos üdítő, pezsgő, cukor, tej, tea, kávé, pizzakesztyű", "F", 0],
        ["Eseményre rendelés (egyszer használatos): tányér, pohár, kiskanál, szalvéta, kéztörlő, WC-papír, 60 és 120 literes szemeteszsák, szappan, kávéspálcika, törlőpapír-guriga", "F", 0],
        ["Tisztítószerek: Igienol, WC-illatosító, légfrissítő spray, felmosófej, seprűfej, porszívózsák", "F", 0],
        ["Heti/havi rögzítés: miből mennyi lett rendelve és miből mennyi fogyott el", "F", 0],
        ["Souvenir shop készlet: pólók, bögrék, kitűző kellékek, stickerek, kulacsok, vasalható fólia", "F", 0],
        ["Irodaszerek: A4 papír, toner, marker, toll, kapocs", "F", 0],
        ["Lejárati dátumok és készlet ellenőrzése minden esemény előtt", "F", 1],
        ["Beszállítók listája, árak összehasonlítása, mennyiségi kedvezmények kérése", "E", 1],
        ["Havi beszerzési költség összesítése a statisztikához", "F", 1]
      ]
    },
    {
      name: "Beosztások",
      note: "Stabil beosztás nélkül nem működik az események lebonyolítása (lásd a Heti beosztás fület).",
      tasks: [
        ["Háromsíkú beosztási rendszer kialakítása: csoportok / irodai munka / fizikai munka", "E", 0],
        ["Havi beosztás kiadása legalább 2 héttel előre", "F", 1],
        ["Csoportokra beosztás: 2 hétvége/alkalmazott/hónap", "F", 0],
        ["Laci beosztása a csoportokra", "F", 0],
        ["Irodai és fizikai munka arányos elosztása (3–3)", "F", 0],
        ["Eseményenkénti feladatkiosztás sablonja (előkészítés, játékvezetés, takarítás, utómunka)", "E", 1],
        ["Helyettesítési rend betegség vagy hiányzás esetére", "E", 1],
        ["Szabadság- és hiányzás-nyilvántartás", "F", 1]
      ]
    },
    {
      name: "Csapat",
      note: "A jó csapat a vendégélmény alapja.",
      tasks: [
        ["Rövid heti csapatmegbeszélés (feladatok, tapasztalatok, következő események)", "F", 1],
        ["Hibák és fekete pontok megbeszélése mosollyal, építő kritikával", "F", 0],
        ["Új munkatársak betanítási (onboarding) folyamata és ellenőrzőlistája", "E", 1],
        ["Munkaköri leírások és felelősségi körök", "E", 1],
        ["Összefoglaló arról, mit kap a csapattag a cégtől: hangulat, támogatás, segítség, lehetőségek, fizetés, változatos munkaprogram, törődés", "E", 0],
        ["Kommunikáció, tanácsadás és támogatás a csapatnak", "F", 0],
        ["Játékvezetői és ügyfélkezelési képzések (felkészülés, játékvezetés minősége, gyorsaság, utómunka)", "F", 0],
        ["Teambuilding alkalmak (negyedévente)", "F", 0],
        ["Elismerés: hónap munkatársa, jó teljesítmény jutalmazása", "F", 1],
        ["Negyedéves anonim csapat-visszajelzés", "F", 1]
      ]
    },
    {
      name: "Kapcsolattartás / adatbázis",
      note: "A vendégek megtartása olcsóbb, mint az újak szerzése.",
      tasks: [
        ["Panaszkezelés és problémaelhárítás gyorsan, helyben", "F", 0],
        ["Gyors, közvetlen válaszok a Google review-kra", "F", 0],
        ["GDPR-megfelelés: adatkezelési hozzájárulás, hírlevél-leiratkozás, adatvédelmi tájékoztató", "E", 1],
        ["Ügyfél-adatbázis (CRM) létrehozása a kapcsolatfelvételtől az utóvéleményig", "E", 1],
        ["Fontos információk előzetes közlése (helyszín, csomaginformációk)", "F", 0],
        ["Automatikus köszönőüzenet és vélemény-kérés beállítása", "E", 0],
        ["Hírlevelek: új játékok, új pálya, események", "F", 0],
        ["Visszacsalogató kampány beállítása (pl. „Már 6 hónapja nem jártál nálunk, tessék 15%-os kupon.”)", "E", 0],
        ["Kapcsolati lista összeállítása: iskolák, rendezvényszervezők, HR-esek, szállodák, külsős segítők", "E", 0],
        ["Kapcsolatok ápolása a fenti partnerekkel", "F", 0],
        ["Adatbázis rendszeres frissítése és tisztítása", "F", 1],
        ["Visszatérő vendégek jutalmazása (hűségkedvezmény, születésnapi üzenet)", "F", 1]
      ]
    },
    {
      name: "Management",
      note: "Az irányítás keretét adja, a többi terület napi működése erre épül.",
      tasks: [
        ["Felelősök kijelölése minden területre (marketing, beszerzés, foglalások, statisztika stb.)", "E", 1],
        ["2027-es célok kitűzése mérhető mutatókkal (a 8 pontos terv alapján)", "E", 0],
        ["Heti prioritások és feladatok szervezése, a to-do lista heti áttekintése", "F", 0],
        ["Pénzügyek és erőforrások kezelése: havi költségvetés, cash flow", "F", 0],
        ["Emberek vezetése", "F", 0],
        ["Döntéshozatal és a döntések rögzítése", "F", 0],
        ["Ellenőrzés: heti/havi áttekintés a célokhoz képest", "F", 0],
        ["Eszközök (vestek, fegyverek, töltők, pálya) állapotának és karbantartásának ellenőrzése", "F", 1],
        ["Negyedéves stratégiai áttekintés", "F", 1]
      ]
    },
    {
      name: "Statisztika",
      note: "Fontos, de a többi terület működése után ad igazán értéket.",
      tasks: [
        ["Közös statisztikai táblázat/dashboard létrehozása minden mutatóhoz", "E", 1],
        ["Mérési gyakoriság rögzítése (javaslat: havi alap, negyedéves mélyebb elemzés, féléves összehasonlítás)", "E", 1],
        ["Összesített árbevétel (LTG, Escape) és átlagos kosárérték", "F", 0],
        ["Költségkövetés: bér, fogyó dolgok, számlák stb.", "F", 0],
        ["Kapacitáskihasználtság: lefoglalt/összes időpont, csúcsidő vs. csúcson kívül", "F", 0],
        ["Lemondási és no-show arányok", "F", 0],
        ["Legnépszerűbb csomag és nap, gyerek/felnőtt arány, átlagos felnőtt játékosszám, fizetési módok aránya (cash/card)", "F", 0],
        ["Marketing- és ügyfélszerzési mutatók: új ügyfél költsége, konverziós arány, csatornák hatékonysága, új/visszatérő arány, ügyfél-élettartam érték", "F", 0],
        ["Ügyfélélmény: NPS, Google/FB/Tripadvisor értékelések, panaszarány", "F", 0],
        ["HR-mutatók: fluktuáció és hiányzás, árbevétel/munkaóra, visszajelzések a munkatársak munkájára", "F", 0]
      ]
    }
  ],

  // Kiinduló beszerzési tételek (a Beszerzés kategória pontjaiból)
  procurement: [
    { category: "Esemény – étel, ital", items: ["Ropi", "Ásványvíz", "Sima víz", "Üdítő (natúr)", "Üdítő (buborékos)", "Pezsgő", "Cukor", "Tej", "Tea", "Kávé", "Pizzakesztyű"] },
    { category: "Esemény – egyszer használatos", items: ["Tányér", "Pohár", "Kiskanál", "Szalvéta", "Kéztörlő", "WC-papír", "Szemeteszsák 60 l", "Szemeteszsák 120 l", "Szappan", "Kávéspálcika", "Törlőpapír-guriga"] },
    { category: "Tisztítószerek", items: ["Igienol", "WC-illatosító", "Légfrissítő spray", "Felmosófej", "Seprűfej", "Porszívózsák"] },
    { category: "Souvenir shop", items: ["Pólók", "Bögrék", "Kitűző kellékek", "Stickerek", "Kulacsok", "Vasalható fólia"] },
    { category: "Irodaszerek", items: ["A4 papír", "Toner", "Marker", "Toll", "Kapocs"] }
  ]
};
