-- ============================================================
--  ISIMM Rooms – Base de données complète
--  Importer via phpMyAdmin ou : mysql -u root < gest_salles.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS gest_salles;
CREATE DATABASE gest_salles CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gest_salles;

-- ============================================================
--  TABLE: utilisateur
-- ============================================================
CREATE TABLE utilisateur (
    id_user       INT AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(100) NOT NULL,
    prenom        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(255) NOT NULL,
    role          ENUM('etudiant','prof','technicien','admin') NOT NULL DEFAULT 'etudiant',
    niveau        VARCHAR(20)  DEFAULT NULL,   -- L1, L2, L3, M1, M2 (etudiants)
    td            VARCHAR(10)  DEFAULT NULL,   -- TD1..TD5
    section       VARCHAR(10)  DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLE: etudiant_profile
-- ============================================================
CREATE TABLE etudiant_profile (
    id_user          INT PRIMARY KEY,
    id_national      VARCHAR(20)  DEFAULT NULL,   -- CIN
    telephone        VARCHAR(20)  DEFAULT NULL,
    date_naissance   DATE         DEFAULT NULL,
    adresse          VARCHAR(255) DEFAULT NULL,
    classe           VARCHAR(50)  DEFAULT NULL,
    FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE
);

-- ============================================================
--  TABLE: prof_profile
-- ============================================================
CREATE TABLE prof_profile (
    id_user      INT PRIMARY KEY,
    id_national  VARCHAR(20)  DEFAULT NULL,
    telephone    VARCHAR(20)  DEFAULT NULL,
    grade        VARCHAR(50)  DEFAULT NULL,
    departement  VARCHAR(100) DEFAULT NULL,
    specialites  TEXT         DEFAULT NULL,   -- JSON array
    classes      TEXT         DEFAULT NULL,   -- JSON array
    FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE
);

-- ============================================================
--  TABLE: technicien_profile
-- ============================================================
CREATE TABLE technicien_profile (
    id_user        INT PRIMARY KEY,
    id_national    VARCHAR(20)  DEFAULT NULL,
    telephone      VARCHAR(20)  DEFAULT NULL,
    domaine        VARCHAR(100) DEFAULT NULL,
    specialites    TEXT         DEFAULT NULL,   -- JSON array
    date_embauche  DATE         DEFAULT NULL,
    disponible     TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE
);

-- ============================================================
--  TABLE: salle
-- ============================================================
CREATE TABLE salle (
    id_salle     INT AUTO_INCREMENT PRIMARY KEY,
    nom_salle    VARCHAR(100) NOT NULL,
    type_salle   ENUM('cours','tp','amphi') NOT NULL DEFAULT 'cours',
    capacite     INT          NOT NULL DEFAULT 30,
    etat         ENUM('disponible','en_maintenance','en panne') NOT NULL DEFAULT 'disponible',
    equipements  TEXT         DEFAULT NULL    -- JSON array of equipment
);

-- ============================================================
--  TABLE: reservation
--    date_creation  : quand la réservation a été faite
--    date           : pour quel jour la salle est réservée
-- ============================================================
CREATE TABLE reservation (
    id_reservation  INT AUTO_INCREMENT PRIMARY KEY,
    date_creation   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- when reservation was made
    date            DATE         NOT NULL,                             -- which day the room is reserved for
    heure_debut     TIME         NOT NULL,
    heure_fin       TIME         NOT NULL,
    motif           VARCHAR(255) DEFAULT NULL,
    statut          ENUM('confirmee','annulee','terminee','fantome') NOT NULL DEFAULT 'confirmee',
    id_user         INT          NOT NULL,
    id_salle        INT          NOT NULL,
    FOREIGN KEY (id_user)  REFERENCES utilisateur(id_user)  ON DELETE CASCADE,
    FOREIGN KEY (id_salle) REFERENCES salle(id_salle)        ON DELETE CASCADE
);

-- ============================================================
--  TABLE: reclamation
-- ============================================================
CREATE TABLE reclamation (
    id_reclamation  INT AUTO_INCREMENT PRIMARY KEY,
    description     TEXT         NOT NULL,
    date            DATE         NOT NULL DEFAULT (CURDATE()),
    categorie_ia    ENUM('IT_RESEAU','MAINTENANCE_CLIM','PROJECTEUR','ELECTRIQUE','AUTRE') NOT NULL DEFAULT 'AUTRE',
    statut          ENUM('en attente','en cours','resolue') NOT NULL DEFAULT 'en attente',
    id_user         INT          NOT NULL,
    id_salle        INT          NOT NULL,
    id_technicien   INT          DEFAULT NULL,
    FOREIGN KEY (id_user)        REFERENCES utilisateur(id_user)  ON DELETE CASCADE,
    FOREIGN KEY (id_salle)       REFERENCES salle(id_salle)        ON DELETE CASCADE,
    FOREIGN KEY (id_technicien)  REFERENCES utilisateur(id_user)   ON DELETE SET NULL
);

-- ============================================================
--  DONNÉES: utilisateurs
--  Mot de passe pour tous : password123
-- ============================================================

-- Admin
INSERT INTO utilisateur (nom,prenom,email,mot_de_passe,role) VALUES
('Admin','Principal','admin@isimm.tn','password123','admin');

-- Techniciens
INSERT INTO utilisateur (nom,prenom,email,mot_de_passe,role) VALUES
('Guesmi','Aicha',    'aicha.guesmi@isimm.tn',   'password123','technicien'),
('Ben Ali','Samir',   'samir.benali@isimm.tn',    'password123','technicien'),
('Trabelsi','Karim',  'karim.trabelsi@isimm.tn',  'password123','technicien'),
('Mansouri','Sonia',  'sonia.mansouri@isimm.tn',  'password123','technicien');

-- Professeurs (61 total - showing representative sample)
INSERT INTO utilisateur (nom,prenom,email,mot_de_passe,role,niveau,td) VALUES
('Ben Salah','Mohamed',   'm.bensalah@isimm.tn',    'password123','prof',NULL,NULL),
('Chaabane','Leila',      'l.chaabane@isimm.tn',     'password123','prof',NULL,NULL),
('Hammami','Nizar',       'n.hammami@isimm.tn',      'password123','prof',NULL,NULL),
('Jebali','Rania',        'r.jebali@isimm.tn',       'password123','prof',NULL,NULL),
('Karray','Fathi',        'f.karray@isimm.tn',       'password123','prof',NULL,NULL),
('Laabidi','Hanen',       'h.laabidi@isimm.tn',      'password123','prof',NULL,NULL),
('Maaloul','Tarek',       't.maaloul@isimm.tn',      'password123','prof',NULL,NULL),
('Nasr','Olfa',           'o.nasr@isimm.tn',         'password123','prof',NULL,NULL),
('Oueslati','Walid',      'w.oueslati@isimm.tn',     'password123','prof',NULL,NULL),
('Riahi','Saoussen',      's.riahi@isimm.tn',        'password123','prof',NULL,NULL),
('Saidi','Imed',          'i.saidi@isimm.tn',        'password123','prof',NULL,NULL),
('Tlili','Dorsaf',        'd.tlili@isimm.tn',        'password123','prof',NULL,NULL),
('Zouari','Faouzi',       'f.zouari@isimm.tn',       'password123','prof',NULL,NULL),
('Abid','Soumaya',        's.abid@isimm.tn',         'password123','prof',NULL,NULL),
('Ayadi','Khaled',        'k.ayadi@isimm.tn',        'password123','prof',NULL,NULL),
('Baccouche','Rim',       'r.baccouche@isimm.tn',    'password123','prof',NULL,NULL),
('Belhadj','Slim',        's.belhadj@isimm.tn',      'password123','prof',NULL,NULL),
('Ben Amara','Ines',      'i.benamara@isimm.tn',     'password123','prof',NULL,NULL),
('Ben Hadj','Mourad',     'm.benhadj@isimm.tn',      'password123','prof',NULL,NULL),
('Boubaker','Amel',       'a.boubaker@isimm.tn',     'password123','prof',NULL,NULL),
('Bouslama','Chaker',     'c.bouslama@isimm.tn',     'password123','prof',NULL,NULL),
('Chaari','Fatma',        'f.chaari@isimm.tn',       'password123','prof',NULL,NULL),
('Derbel','Nabil',        'n.derbel@isimm.tn',       'password123','prof',NULL,NULL),
('El Amri','Sihem',       's.elamri@isimm.tn',       'password123','prof',NULL,NULL),
('Feki','Adnen',          'a.feki@isimm.tn',         'password123','prof',NULL,NULL),
('Gara','Monia',          'm.gara@isimm.tn',         'password123','prof',NULL,NULL),
('Haddad','Yassine',      'y.haddad@isimm.tn',       'password123','prof',NULL,NULL),
('Jelassi','Kaouther',    'k.jelassi@isimm.tn',      'password123','prof',NULL,NULL),
('Kessentini','Youssef',  'y.kessentini@isimm.tn',   'password123','prof',NULL,NULL),
('Lamine','Wafa',         'w.lamine@isimm.tn',       'password123','prof',NULL,NULL),
('Marzouki','Hatem',      'h.marzouki@isimm.tn',     'password123','prof',NULL,NULL),
('Nefzi','Amira',         'a.nefzi@isimm.tn',        'password123','prof',NULL,NULL),
('Omri','Sami',           's.omri@isimm.tn',         'password123','prof',NULL,NULL),
('Rekik','Dalila',        'd.rekik@isimm.tn',        'password123','prof',NULL,NULL),
('Selmi','Bechir',        'b.selmi@isimm.tn',        'password123','prof',NULL,NULL),
('Turki','Nadia',         'n.turki@isimm.tn',        'password123','prof',NULL,NULL),
('Wali','Hedi',           'h.wali@isimm.tn',         'password123','prof',NULL,NULL),
('Yahyaoui','Sana',       's.yahyaoui@isimm.tn',     'password123','prof',NULL,NULL),
('Zarrougui','Mehdi',     'm.zarrougui@isimm.tn',    'password123','prof',NULL,NULL),
('Azizi','Lobna',         'l.azizi@isimm.tn',        'password123','prof',NULL,NULL),
('Ben Fredj','Tarek',     't.benfredj@isimm.tn',     'password123','prof',NULL,NULL),
('Charfi','Asma',         'a.charfi@isimm.tn',       'password123','prof',NULL,NULL),
('Dhahri','Saber',        's.dhahri@isimm.tn',       'password123','prof',NULL,NULL),
('Elloumi','Mouna',       'm.elloumi@isimm.tn',      'password123','prof',NULL,NULL),
('Gharbi','Aymen',        'a.gharbi@isimm.tn',       'password123','prof',NULL,NULL),
('Hamdi','Chiraz',        'c.hamdi@isimm.tn',        'password123','prof',NULL,NULL),
('Issaoui','Bilel',       'b.issaoui@isimm.tn',      'password123','prof',NULL,NULL),
('Jomaa','Hajer',         'h.jomaa@isimm.tn',        'password123','prof',NULL,NULL),
('Khemiri','Riadh',       'r.khemiri@isimm.tn',      'password123','prof',NULL,NULL),
('Louati','Manel',        'm.louati@isimm.tn',       'password123','prof',NULL,NULL),
('Mejri','Skander',       's.mejri@isimm.tn',        'password123','prof',NULL,NULL),
('Naceur','Abir',         'a.naceur@isimm.tn',       'password123','prof',NULL,NULL),
('Ouni','Ferid',          'f.ouni@isimm.tn',         'password123','prof',NULL,NULL),
('Pachouri','Zied',       'z.pachouri@isimm.tn',     'password123','prof',NULL,NULL),
('Rouissi','Sabrine',     's.rouissi@isimm.tn',      'password123','prof',NULL,NULL),
('Souissi','Kais',        'k.souissi@isimm.tn',      'password123','prof',NULL,NULL),
('Touil','Nesrine',       'n.touil@isimm.tn',        'password123','prof',NULL,NULL),
('Ulysse','Marc',         'm.ulysse@isimm.tn',       'password123','prof',NULL,NULL),
('Vafi','Lamia',          'l.vafi@isimm.tn',         'password123','prof',NULL,NULL),
('Werfelli','Chokri',     'c.werfelli@isimm.tn',     'password123','prof',NULL,NULL),
('Xoumi','Dorra',         'd.xoumi@isimm.tn',        'password123','prof',NULL,NULL);

-- Étudiants (21 total)
INSERT INTO utilisateur (nom,prenom,email,mot_de_passe,role,niveau,td,section) VALUES
('Ben Ammar','Omar',   'omar@etudiant.univ.edu',    'password123','etudiant','L1','TD1','Informatique'),
('Chaabane','Nour',    'nour@etudiant.univ.edu',    'password123','etudiant','L1','TD2','Informatique'),
('Dkhili','Hatem',     'hatem@etudiant.univ.edu',   'password123','etudiant','L2','TD2','Informatique'),
('El Amri','Sana',     'sana@etudiant.univ.edu',    'password123','etudiant','L2','TD3','Informatique'),
('Etudiant','Youssef', 'youssef@etudiant.univ.edu', 'password123','etudiant','L2','TD1','Informatique'),
('Etudiant','Mohamed', 'mohamed@etudiant.univ.edu', 'password123','etudiant','L2','TD1','Informatique'),
('Etudiant','Ali',     'ali@etudiant.univ.edu',     'password123','etudiant','M1','TD4','Informatique'),
('Etudiante','Amira',  'amira@etudiant.univ.edu',   'password123','etudiant','L3','TD2','Informatique'),
('Etudiante','Fatima', 'fatima@etudiant.univ.edu',  'password123','etudiant','L3','TD3','Informatique'),
('Feki','Rami',        'rami@etudiant.univ.edu',    'password123','etudiant','L3','TD3','Informatique'),
('Ghedira','Ines',     'ines@etudiant.univ.edu',    'password123','etudiant','L3','TD1','Informatique'),
('Haddad','Mehdi',     'mehdi@etudiant.univ.edu',   'password123','etudiant','M1','TD4','Informatique'),
('Jebali','Yasmine',   'yasmine@etudiant.univ.edu', 'password123','etudiant','M1','TD2','Informatique'),
('Karoui','Wael',      'wael@etudiant.univ.edu',    'password123','etudiant','M2','TD1','Informatique'),
('Lahmar','Asma',      'asma@etudiant.univ.edu',    'password123','etudiant','M2','TD3','Informatique'),
('Maatoug','Tarek',    'tarek@etudiant.univ.edu',   'password123','etudiant','L2','TD5','Informatique'),
('Nasri','Mariem',     'mariem@etudiant.univ.edu',  'password123','etudiant','L3','TD4','Informatique'),
('Ouerghi','Zied',     'zied@etudiant.univ.edu',    'password123','etudiant','L1','TD3','Informatique'),
('Riahi','Sana',       'sana.r@etudiant.univ.edu',  'password123','etudiant','L2','TD4','Informatique'),
('Sfaxi','Khalil',     'khalil@etudiant.univ.edu',  'password123','etudiant','M1','TD5','Informatique'),
('Tlili','Rim',        'rim@etudiant.univ.edu',     'password123','etudiant','M2','TD2','Informatique');

-- ============================================================
--  DONNÉES: profiles techniciens
-- ============================================================
INSERT INTO technicien_profile (id_user,id_national,telephone,domaine,specialites,date_embauche,disponible) VALUES
(2, '08123456','22345678','Réseaux & Informatique','["Wi-Fi","Réseau","Serveurs"]','2019-09-01',1),
(3, '09234567','23456789','Électricité & Climatisation','["Électricité","Climatisation","Ventilation"]','2020-03-15',1),
(4, '10345678','24567890','Audiovisuel','["Projecteur","Écran","Câblage"]','2021-06-01',1),
(5, '11456789','25678901','Mobilier & Infrastructure','["Mobilier","Peinture","Serrurerie"]','2022-01-10',0);

-- ============================================================
--  DONNÉES: profiles professeurs (sample)
-- ============================================================
INSERT INTO prof_profile (id_user,id_national,telephone,grade,departement,specialites) VALUES
(6,  '01100001','71100001','Maître de Conférences','Informatique','["Algorithmique","Structures de données"]'),
(7,  '01100002','71100002','Professeur','Mathématiques','["Algèbre","Analyse"]'),
(8,  '01100003','71100003','Assistant','Informatique','["Réseaux","Sécurité"]'),
(9,  '01100004','71100004','Maître Assistant','Informatique','["Base de données","SQL"]'),
(10, '01100005','71100005','Professeur','Informatique','["Intelligence artificielle","Machine Learning"]');

-- ============================================================
--  DONNÉES: profiles étudiants
-- ============================================================
INSERT INTO etudiant_profile (id_user,id_national,telephone,date_naissance,adresse,classe) VALUES
(67, '12000001','55678901','2003-04-15','Rue 12 Monastir',  'L1-TD1'),
(68, '12000002','55789012','2003-07-22','Avenue Habib Monastir','L1-TD2'),
(69, '12000003','55890123','2002-11-30','Cité Erriadh Sousse','L2-TD2'),
(70, '12000004','55901234','2002-03-18','Rue Ibn Khaldoun Monastir','L2-TD3'),
(71, '12000005','56012345','2002-09-05','Avenue 7 Novembre Moknine','L2-TD1'),
(72, '12000006','56123456','2002-06-14','Rue Farhat Hached Monastir','L2-TD1'),
(73, '12000007','56234567','2001-12-20','Avenue Bourguiba Sousse','M1-TD4'),
(74, '12000008','56345678','2002-02-28','Cité Olympique Monastir','L3-TD2'),
(75, '12000009','56456789','2002-05-11','Rue Tahar Haddad Sousse','L3-TD3'),
(76, '12000010','56567890','2002-08-17','Avenue de la République Monastir','L3-TD3'),
(77, '12000011','56678901','2001-10-03','Rue Habib Thameur Moknine','L3-TD1'),
(78, '12000012','56789012','2001-01-25','Avenue 20 Mars Monastir','M1-TD4'),
(79, '12000013','56890123','2001-07-09','Rue Alain Savary Sousse','M1-TD2'),
(80, '12000014','56901234','2000-11-16','Avenue Kheireddine Monastir','M2-TD1'),
(81, '12000015','57012345','2000-04-22','Cité El Wafa Monastir','M2-TD3'),
(82, '12000016','57123456','2002-09-30','Rue de l Indépendance Monastir','L2-TD5'),
(83, '12000017','57234567','2001-03-07','Avenue Farhat Hached Sousse','L3-TD4'),
(84, '12000018','57345678','2003-06-19','Rue Mongi Slim Monastir','L1-TD3'),
(85, '12000019','57456789','2002-10-24','Avenue Hedi Chaker Monastir','L2-TD4'),
(86, '12000020','57567890','2001-08-13','Rue Ibn Sina Sousse','M1-TD5'),
(87, '12000021','57678901','2000-02-06','Avenue Habib Bourguiba Moknine','M2-TD2');

-- ============================================================
--  DONNÉES: salles (46 salles)
-- ============================================================
INSERT INTO salle (nom_salle,type_salle,capacite,etat,equipements) VALUES
-- Salles de cours (20)
('Salle TD 101','cours',35,'disponible','["Projecteur","Tableau blanc","Climatisation","Wi-Fi"]'),
('Salle TD 102','cours',35,'disponible','["Projecteur","Tableau blanc","Climatisation","Wi-Fi"]'),
('Salle TD 103','cours',35,'disponible','["Tableau blanc","Climatisation"]'),
('Salle TD 104','cours',30,'disponible','["Projecteur","Tableau blanc","Wi-Fi"]'),
('Salle TD 105','cours',30,'disponible','["Tableau blanc","Climatisation"]'),
('Salle TD 201','cours',40,'disponible','["Projecteur","Tableau blanc","Climatisation","Wi-Fi"]'),
('Salle TD 202','cours',40,'disponible','["Projecteur","Tableau blanc","Climatisation"]'),
('Salle TD 203','cours',35,'disponible','["Tableau blanc","Wi-Fi"]'),
('Salle TD 204','cours',35,'en_maintenance','["Projecteur","Tableau blanc","Climatisation"]'),
('Salle TD 205','cours',30,'disponible','["Tableau blanc","Climatisation"]'),
('Salle TD 301','cours',40,'disponible','["Projecteur","Tableau blanc","Climatisation","Wi-Fi"]'),
('Salle TD 302','cours',40,'disponible','["Projecteur","Tableau blanc","Climatisation"]'),
('Salle TD 303','cours',35,'disponible','["Tableau blanc","Wi-Fi"]'),
('Salle TD 304','cours',35,'disponible','["Projecteur","Tableau blanc","Climatisation"]'),
('Salle TD 305','cours',30,'en panne','["Tableau blanc"]'),
('Salle Reunion A','cours',20,'disponible','["Projecteur","Tableau blanc","Wi-Fi","Climatisation"]'),
('Salle Reunion B','cours',20,'disponible','["Projecteur","Tableau blanc","Wi-Fi"]'),
('Salle Seminaire','cours',50,'disponible','["Projecteur","Microphone","Climatisation","Wi-Fi"]'),
('Salle Polyvalente','cours',60,'disponible','["Projecteur","Microphone","Tableau blanc","Climatisation","Wi-Fi"]'),
('Salle Direction','cours',15,'disponible','["Projecteur","Tableau blanc","Climatisation"]'),
-- Labos / TP (18)
('Labo Info 1','tp',25,'disponible','["30 PCs","Projecteur","Climatisation","Wi-Fi"]'),
('Labo Info 2','tp',25,'disponible','["30 PCs","Projecteur","Climatisation","Wi-Fi"]'),
('Labo Info 3','tp',25,'disponible','["28 PCs","Projecteur","Climatisation","Wi-Fi"]'),
('Labo Info 4','tp',25,'disponible','["28 PCs","Tableau blanc","Climatisation","Wi-Fi"]'),
('Labo Info 5','tp',20,'en_maintenance','["25 PCs","Projecteur","Climatisation"]'),
('Labo Réseau','tp',20,'disponible','["20 PCs","Équipements réseau","Climatisation","Wi-Fi"]'),
('Labo Électronique','tp',20,'disponible','["Oscilloscopes","Générateurs","Climatisation"]'),
('Labo Chimie','tp',24,'disponible','["Paillasses","Hotte aspirante","Climatisation"]'),
('Labo Physique','tp',24,'disponible','["Bancs optique","Matériel physique","Climatisation"]'),
('Labo Maths','tp',30,'disponible','["Tableau blanc","Climatisation","Wi-Fi"]'),
('Salle TP 1','tp',30,'disponible','["Projecteur","PCs","Climatisation","Wi-Fi"]'),
('Salle TP 2','tp',30,'disponible','["Projecteur","PCs","Climatisation","Wi-Fi"]'),
('Salle TP 3','tp',30,'disponible','["Projecteur","PCs","Climatisation"]'),
('Salle TP 4','tp',28,'disponible','["Projecteur","PCs","Climatisation","Wi-Fi"]'),
('Salle TP 5','tp',28,'disponible','["PCs","Tableau blanc","Climatisation"]'),
('Salle TP 6','tp',25,'disponible','["Projecteur","PCs","Climatisation","Wi-Fi"]'),
('Salle Conception','tp',20,'disponible','["Stations CAO","Projecteur","Climatisation","Wi-Fi"]'),
('Salle Simulation','tp',20,'disponible','["Stations haute perf.","Projecteur","Climatisation","Wi-Fi"]'),
-- Amphithéâtres (8)
('Amphi A','amphi',200,'disponible','["Projecteur HD","Microphone","Climatisation","Wi-Fi","Scène"]'),
('Amphi B','amphi',200,'disponible','["Projecteur HD","Microphone","Climatisation","Wi-Fi","Scène"]'),
('Amphi C','amphi',150,'disponible','["Projecteur HD","Microphone","Climatisation","Wi-Fi"]'),
('Amphi D','amphi',150,'disponible','["Projecteur HD","Microphone","Climatisation","Wi-Fi"]'),
('Amphi E','amphi',120,'disponible','["Projecteur","Microphone","Climatisation","Wi-Fi"]'),
('Amphi F','amphi',120,'disponible','["Projecteur","Microphone","Climatisation"]'),
('Amphi G','amphi',100,'disponible','["Projecteur","Microphone","Climatisation","Wi-Fi"]'),
('Amphi H','amphi',80,'disponible','["Projecteur","Microphone","Climatisation"]');

-- ============================================================
--  DONNÉES: reservations
--  date_creation = quand la résa a été faite
--  date          = pour quel jour la salle est réservée
-- ============================================================
INSERT INTO reservation (date_creation,date,heure_debut,heure_fin,motif,statut,id_user,id_salle) VALUES

-- Réservations passées (terminées)
('2026-03-01 08:00:00','2026-03-03','08:00','10:00','Cours Algorithmique L2',          'terminee',6, 1),
('2026-03-01 09:00:00','2026-03-03','10:00','12:00','TP Base de données L3',            'terminee',9, 21),
('2026-03-02 07:30:00','2026-03-04','08:00','10:00','Cours Réseaux L2',                 'terminee',8, 2),
('2026-03-02 08:00:00','2026-03-04','14:00','16:00','Cours Mathématiques L1',           'terminee',7, 6),
('2026-03-03 10:00:00','2026-03-05','08:00','10:00','TP Programmation L2',              'terminee',6, 22),
('2026-03-03 11:00:00','2026-03-05','10:00','12:00','Amphi Conférence IA',              'terminee',10,39),
('2026-03-04 08:00:00','2026-03-06','08:00','10:00','Cours Structures de données',     'terminee',6, 3),
('2026-03-05 09:00:00','2026-03-07','14:00','16:00','Réunion pédagogique',              'terminee',6, 16),
('2026-03-06 10:00:00','2026-03-10','08:00','10:00','TP Réseaux L3',                   'terminee',8, 26),
('2026-03-07 11:00:00','2026-03-10','10:00','12:00','Cours IA Master',                 'terminee',10,7),
('2026-03-08 08:00:00','2026-03-11','08:00','10:00','TP Labo Chimie',                  'terminee',9, 28),
('2026-03-08 09:00:00','2026-03-11','14:00','16:00','Amphi cours magistral',           'terminee',7, 40),
('2026-03-10 07:30:00','2026-03-12','08:00','10:00','Cours Analyse Numérique',         'terminee',7, 4),
('2026-03-10 08:00:00','2026-03-12','10:00','12:00','TP Programmation Web',            'terminee',9, 23),
('2026-03-11 09:00:00','2026-03-13','08:00','10:00','Cours Probabilités L2',           'terminee',7, 8),
('2026-03-11 10:00:00','2026-03-13','14:00','16:00','TP Simulation',                   'terminee',10,38),
('2026-03-12 08:00:00','2026-03-14','08:00','10:00','Cours Sécurité Informatique',     'terminee',8, 11),
('2026-03-12 09:00:00','2026-03-14','10:00','12:00','TP Électronique',                 'terminee',9, 27),
('2026-03-14 07:30:00','2026-03-17','08:00','10:00','Cours Compilation L3',            'terminee',6, 12),
('2026-03-14 08:00:00','2026-03-17','10:00','12:00','Amphi Informatique Théorique',    'terminee',10,41),
-- Réservations de cette semaine (confirmées)
('2026-03-28 08:00:00','2026-04-07','08:00','10:00','Cours Algorithmique L3',          'confirmee',6, 1),
('2026-03-28 09:30:00','2026-04-07','10:00','12:00','TP Base de données L2',            'confirmee',9, 21),
('2026-03-29 08:00:00','2026-04-07','14:00','16:00','Cours Réseaux M1',                'confirmee',8, 2),
('2026-03-29 10:00:00','2026-04-08','08:00','10:00','Cours Maths Avancées M2',         'confirmee',7, 7),
('2026-03-30 08:30:00','2026-04-08','10:00','12:00','TP Programmation Système',        'confirmee',6, 22),
('2026-03-30 09:00:00','2026-04-08','14:00','16:00','Réunion département Info',        'confirmee',8, 17),
('2026-03-31 07:30:00','2026-04-09','08:00','10:00','Cours Génie Logiciel L3',         'confirmee',9, 3),
('2026-03-31 08:00:00','2026-04-09','10:00','12:00','TP Labo Réseau',                  'confirmee',8, 26),
('2026-04-01 08:00:00','2026-04-09','14:00','16:00','Cours IA Appliquée M1',           'confirmee',10,11),
('2026-04-01 09:00:00','2026-04-10','08:00','10:00','Amphi Journée Portes Ouvertes',   'confirmee',6, 39),
('2026-04-02 07:30:00','2026-04-10','10:00','12:00','Cours Compilation M1',            'confirmee',6, 12),
('2026-04-02 08:00:00','2026-04-10','14:00','16:00','TP Conception BD',                'confirmee',9, 37),
-- Réservations futures
('2026-04-05 08:00:00','2026-04-14','08:00','10:00','Cours Systèmes Distribués M2',   'confirmee',10,13),
('2026-04-05 09:00:00','2026-04-14','10:00','12:00','TP Sécurité Réseaux',            'confirmee',8, 24),
('2026-04-06 08:30:00','2026-04-15','08:00','10:00','Cours Vision par Ordinateur M2', 'confirmee',10,14),
('2026-04-06 09:00:00','2026-04-15','10:00','12:00','TP Labo Physique',               'confirmee',9, 29),
('2026-04-07 08:00:00','2026-04-16','08:00','10:00','Cours Prog. Fonctionnelle L3',   'confirmee',6, 6),
('2026-04-07 09:30:00','2026-04-16','14:00','16:00','TP Labo Info 3',                 'confirmee',9, 23),
('2026-04-07 10:00:00','2026-04-17','08:00','10:00','Amphi Semaine Culturelle',        'confirmee',7, 40),
('2026-04-08 08:00:00','2026-04-17','10:00','12:00','Cours Méthodes Formelles M1',    'confirmee',10,8),
-- Réservations annulées
('2026-03-15 08:00:00','2026-03-20','08:00','10:00','Cours annulé – congé',            'annulee',6, 1),
('2026-03-20 09:00:00','2026-03-25','14:00','16:00','Réunion reportée',               'annulee',8, 16),
-- Ghost bookings (présence non confirmée)
('2026-03-10 07:00:00','2026-03-18','08:00','10:00','Cours – absence signalée',        'fantome',7, 4),
('2026-03-17 08:00:00','2026-03-24','10:00','12:00','TP – salle vide constatée',       'fantome',9, 22);

-- ============================================================
--  DONNÉES: reclamations
-- ============================================================
INSERT INTO reclamation (description,date,categorie_ia,statut,id_user,id_salle,id_technicien) VALUES

-- Résolues
('Tableau blanc Salle TD 102 taché, difficile à effacer',                   '2026-04-13','AUTRE',      'resolue',  67,2,  NULL),
('Caméra PTZ du séminaire déréglée, ne suit plus le présentateur',          '2026-04-12','AUTRE',      'resolue',  8, 18, 3),
('Hotte aspirante Labo Chimie ventilation trop faible',                     '2026-04-12','MAINTENANCE_CLIM','resolue',9,28, 3),
('Lumière clignotante salle réunion B gêne les réunions',                   '2026-04-11','ELECTRIQUE', 'resolue',  6, 17, 3),
('Imprimante 3D Labo Info 2 hors service depuis lundi',                     '2026-04-11','AUTRE',      'resolue',  8, 22, NULL),
('Chaises branlantes rangée 3 Salle TD 101, risque de chute',               '2026-04-10','AUTRE',      'en attente',69,1, 3),
('Wi-Fi très faible dans Labo Info 4, impossible de télécharger les TPs',   '2026-04-10','IT_RESEAU',  'resolue',  70,24, 2),
('Projecteur Amphi A grésille et s\'éteint toutes les 10 minutes',          '2026-04-09','PROJECTEUR', 'resolue',  7, 39, 4),
('Prise électrique Salle TD 203 ne fonctionne plus, câble brûlé visiblement','2026-04-09','ELECTRIQUE','resolue',  8, 8, 3),
('Climatisation Salle TD 301 fait du bruit et ne refroidit plus',           '2026-04-08','MAINTENANCE_CLIM','en attente',6,11,3),
('Réseau filaire Labo Réseau: 5 prises RJ45 mortes côté gauche',            '2026-04-08','IT_RESEAU',  'resolue',  9, 26, 2),
('Porte Salle TD 305 ne ferme plus à clé depuis 3 jours',                   '2026-04-07','AUTRE',      'resolue',  69,15, NULL),
('Écran projection Amphi B déchiré sur le côté gauche',                     '2026-04-07','PROJECTEUR', 'en attente',7,40, 4),
('Interrupteur lumière Salle TD 104 bloqué en position ON',                 '2026-04-06','ELECTRIQUE', 'resolue',  8, 4, 3),
('Micro-onde salle pause techniciens en panne depuis vendredi',             '2026-04-06','ELECTRIQUE', 'resolue',  6, 20, 3),
('Connexion Wi-Fi Amphi C coupée en plein cours magistral',                 '2026-04-05','IT_RESEAU',  'resolue',  10,41, 2),
('Climatisation Labo Info 5 complètement tombée en panne',                  '2026-04-05','MAINTENANCE_CLIM','resolue',9,25,3),
('Projecteur Salle TD 201 câble HDMI mort, plus de connexion laptop',       '2026-04-04','PROJECTEUR', 'resolue',  6, 6, 4),
('Tableau numérique interactif Salle TD 302 écran tactile ne répond plus',  '2026-04-04','AUTRE',      'resolue',  8, 12, NULL),
('Fuite d\'eau au plafond Salle TD 204 après la pluie',                     '2026-04-03','AUTRE',      'resolue',  7, 9, NULL);

SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
--  TABLE: notifications
-- ============================================================
CREATE TABLE notification (
    id_notification  INT AUTO_INCREMENT PRIMARY KEY,
    id_user          INT NOT NULL,           -- who receives the notification
    type             VARCHAR(50) NOT NULL,   -- 'signalement', 'reservation', 'assignment', 'resolved', etc.
    title            VARCHAR(255) NOT NULL,
    message          TEXT,
    link             VARCHAR(255),           -- where to go when clicked
    is_read          TINYINT(1) DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES utilisateur(id_user) ON DELETE CASCADE
);

-- Index for fast fetching of unread notifications
CREATE INDEX idx_notification_user_read ON notification(id_user, is_read);
CREATE INDEX idx_notification_created ON notification(created_at DESC);

-- ============================================================
--  ISIMM Rooms – Additions SQL
--  Run this AFTER importing gest_salles.sql
--  mysql -u root gest_salles < additions.sql
-- ============================================================

USE gest_salles;

-- ============================================================
--  TABLE: classe
--  Represents a class group (L1 Info, L2 Info, M1 Info, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS classe (
    id_classe   INT AUTO_INCREMENT PRIMARY KEY,
    grade       ENUM('Licence','Master','Ingénierie','Cycle Prépa') NOT NULL,
    niveau      VARCHAR(20)  NOT NULL,   -- L1, L2, L3, M1, M2, Ing1, Ing2, Ing3, CP1, CP2
    specialite  VARCHAR(100) NOT NULL,   -- Info, Math, Physique, etc.
    nom_classe  VARCHAR(100) NOT NULL,   -- e.g. "L1 Informatique – Groupe A"
    capacite    INT          DEFAULT 30,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLE: classe_etudiant
--  Links students to their class
-- ============================================================
CREATE TABLE IF NOT EXISTS classe_etudiant (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    id_classe   INT NOT NULL,
    id_etudiant INT NOT NULL,
    UNIQUE KEY uq_classe_etudiant (id_classe, id_etudiant),
    FOREIGN KEY (id_classe)   REFERENCES classe(id_classe)      ON DELETE CASCADE,
    FOREIGN KEY (id_etudiant) REFERENCES utilisateur(id_user)   ON DELETE CASCADE
);

-- ============================================================
--  TABLE: presence
-- ============================================================
CREATE TABLE IF NOT EXISTS presence (
    event_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    room_id     INT          NOT NULL,
    event_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilisateur(id_user) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES salle(id_salle)      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_presence_user  ON presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_room  ON presence(room_id);
CREATE INDEX IF NOT EXISTS idx_presence_time  ON presence(event_time);

-- ============================================================
--  TABLE: news
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
    id_news     INT AUTO_INCREMENT PRIMARY KEY,
    titre       VARCHAR(255) NOT NULL,
    contenu     TEXT         NOT NULL,
    id_auteur   INT          NOT NULL,    -- admin user id
    cible       ENUM('tous','etudiant','prof','all') NOT NULL DEFAULT 'tous',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_auteur) REFERENCES utilisateur(id_user) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_news_created ON news(created_at DESC);

-- ============================================================
--  SEED: classes (grade > niveau > specialite)
-- ============================================================
INSERT INTO classe (grade, niveau, specialite, nom_classe, capacite) VALUES
-- Licence
('Licence', 'L1', 'Informatique',      'L1 Informatique',       35),
('Licence', 'L1', 'Mathématiques',     'L1 Mathématiques',      30),
('Licence', 'L2', 'Informatique',      'L2 Informatique',       35),
('Licence', 'L2', 'Mathématiques',     'L2 Mathématiques',      30),
('Licence', 'L3', 'Informatique',      'L3 Informatique',       35),
('Licence', 'L3', 'Mathématiques',     'L3 Mathématiques',      30),
-- Master
('Master',  'M1', 'Informatique',      'M1 Informatique',       25),
('Master',  'M1', 'Réseaux',           'M1 Réseaux & Sécurité', 25),
('Master',  'M2', 'Informatique',      'M2 Informatique',       25),
('Master',  'M2', 'Réseaux',           'M2 Réseaux & Sécurité', 20),
-- Ingénierie
('Ingénierie', 'Ing1', 'Informatique', 'Ing1 Informatique',     30),
('Ingénierie', 'Ing2', 'Informatique', 'Ing2 Informatique',     30),
('Ingénierie', 'Ing3', 'Informatique', 'Ing3 Informatique',     30),
-- Cycle Prépa
('Cycle Prépa', 'CP1', 'Sciences',     'CP1 Sciences',          40),
('Cycle Prépa', 'CP2', 'Sciences',     'CP2 Sciences',          40);

-- ============================================================
--  SEED: assign existing students to classes
--  (students in utilisateur with role='etudiant' and niveau set)
-- ============================================================
-- Assign students whose niveau matches L2 to L2 Info class (id 3)
INSERT IGNORE INTO classe_etudiant (id_classe, id_etudiant)
SELECT 3, id_user FROM utilisateur
WHERE role='etudiant' AND niveau='L2';

-- Assign students with niveau L3 to L3 Info (id 5)
INSERT IGNORE INTO classe_etudiant (id_classe, id_etudiant)
SELECT 5, id_user FROM utilisateur
WHERE role='etudiant' AND niveau='L3';

-- Assign students with niveau M1 to M1 Info (id 7)
INSERT IGNORE INTO classe_etudiant (id_classe, id_etudiant)
SELECT 7, id_user FROM utilisateur
WHERE role='etudiant' AND niveau='M1';

-- Assign students with niveau M2 to M2 Info (id 9)
INSERT IGNORE INTO classe_etudiant (id_classe, id_etudiant)
SELECT 9, id_user FROM utilisateur
WHERE role='etudiant' AND niveau='M2';

-- Assign remaining students (no niveau) to L1 Info (id 1)
INSERT IGNORE INTO classe_etudiant (id_classe, id_etudiant)
SELECT 1, id_user FROM utilisateur
WHERE role='etudiant' AND (niveau IS NULL OR niveau='');

-- ============================================================
--  MIGRATION: Add proper presences table
--  Run this once against your gest_salles database
-- ============================================================

-- New table: presences (replaces/supplements the old presence table)
-- Tracks per-student, per-class, per-day attendance marked by a prof
CREATE TABLE IF NOT EXISTS presences (
    id_presence   INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,                        -- étudiant
    id_classe     INT          NOT NULL,                        -- which class
    date_presence DATE         NOT NULL,                        -- which day
    present       TINYINT(1)   NOT NULL DEFAULT 0,              -- 1=present, 0=absent
    prof_id       INT          NULL,                            -- prof who marked it
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_presence (user_id, id_classe, date_presence),
    FOREIGN KEY (user_id)   REFERENCES utilisateur(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_classe) REFERENCES classe(id_classe)    ON DELETE CASCADE,
    FOREIGN KEY (prof_id)   REFERENCES utilisateur(id_user) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_presences_user  ON presences(user_id);
CREATE INDEX IF NOT EXISTS idx_presences_class ON presences(id_classe);
CREATE INDEX IF NOT EXISTS idx_presences_date  ON presences(date_presence);