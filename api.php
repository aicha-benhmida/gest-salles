<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── DB CONNECTION ─────────────────────────────────────────────────────────────
$db = new mysqli('localhost', 'root', '', 'gest_salles');
if ($db->connect_error) { die(json_encode(['error' => 'DB connection failed'])); }
$db->set_charset('utf8mb4');

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────
session_start();

// ── CREATE NOTIFICATION HELPER ──────────────────────────────────────────────
function createNotification($db, $user_id, $type, $title, $message, $link = '') {
    $uid = (int)$user_id;
    $type = $db->real_escape_string($type);
    $title = $db->real_escape_string($title);
    $message = $db->real_escape_string($message);
    $link = $db->real_escape_string($link);
    
    $db->query("INSERT INTO notification (id_user, type, title, message, link) 
                VALUES ($uid, '$type', '$title', '$message', '$link')");
    return $db->insert_id;
}

// ── NOTIFY ADMINS ───────────────────────────────────────────────────────────
function notifyAdmins($db, $type, $title, $message, $link = '') {
    $admins = $db->query("SELECT id_user FROM utilisateur WHERE role='admin'");
    while ($a = $admins->fetch_assoc()) {
        createNotification($db, $a['id_user'], $type, $title, $message, $link);
    }
}

// ── NOTIFY TECHNICIENS ──────────────────────────────────────────────────────
function notifyTechniciens($db, $type, $title, $message, $link = '') {
    $techs = $db->query("SELECT id_user FROM utilisateur WHERE role='technicien'");
    while ($t = $techs->fetch_assoc()) {
        createNotification($db, $t['id_user'], $type, $title, $message, $link);
    }
}

function getCurrentUserId() {
    if (!empty($_SESSION['user_id'])) return $_SESSION['user_id'];
    $hdr = $_SERVER['HTTP_X_USER_ID'] ?? '';
    if ($hdr !== '' && ctype_digit($hdr)) return (int)$hdr;
    return null;
}

function timeAgo($datetime) {
    $time = strtotime($datetime);
    $nowRow = $GLOBALS['db']->query("SELECT NOW() as now")->fetch_assoc();
    $now = strtotime($nowRow['now']);
    $diff = $now - $time;
    
    if ($diff < 60) return 'À l\'instant';
    if ($diff < 3600) return floor($diff/60) . ' min';
    if ($diff < 86400) return floor($diff/3600) . 'h';
    if ($diff < 604800) return floor($diff/86400) . 'j';
    return date('d/m/Y', $time);
}

function requireLogin() {
    if (!getCurrentUserId()) {
        http_response_code(401);
        echo json_encode(['error' => 'Non authentifié']);
        exit;
    }
}

function getBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION TRIGGERS FOR ALL ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

switch ($action = $_GET['action'] ?? '') {

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    case 'login':
        $body  = getBody();
        $email = $db->real_escape_string($body['email'] ?? '');
        $pass  = $body['password'] ?? '';
        $row   = $db->query("SELECT * FROM utilisateur WHERE email='$email'")->fetch_assoc();
        if ($row && ($pass === $row['mot_de_passe'] || password_verify($pass, $row['mot_de_passe']))) {
            $_SESSION['user_id']   = $row['id_user'];
            $_SESSION['user_role'] = $row['role'];
            echo json_encode(['success'=>true, 'id_user'=>$row['id_user'], 'role'=>$row['role'], 'nom'=>$row['nom'], 'prenom'=>$row['prenom']]);
        } else {
            echo json_encode(['success'=>false, 'error'=>'Email ou mot de passe incorrect']);
        }
        break;

    // ── REGISTER ──────────────────────────────────────────────────────────────
    case 'register':
        $b = getBody();
        $nom    = $db->real_escape_string($b['nom'] ?? '');
        $prenom = $db->real_escape_string($b['prenom'] ?? '');
        $email  = $db->real_escape_string($b['email'] ?? '');
        $pass   = $db->real_escape_string($b['password'] ?? '');
        $role   = $db->real_escape_string($b['role'] ?? 'etudiant');
        $niveau = $db->real_escape_string($b['niveau'] ?? '');
        $td     = $db->real_escape_string($b['td'] ?? '');
        $section= $db->real_escape_string($b['section'] ?? '');
        
        if (!$nom || !$prenom || !$email || !$pass) { 
            echo json_encode(['success'=>false,'error'=>'Champs requis manquants']); 
            break; 
        }
        if ($db->query("SELECT id_user FROM utilisateur WHERE email='$email'")->num_rows > 0) { 
            echo json_encode(['success'=>false,'error'=>'Email déjà utilisé']); 
            break; 
        }
        
        $db->query("INSERT INTO utilisateur (nom,prenom,email,mot_de_passe,role,niveau,td,section) VALUES ('$nom','$prenom','$email','$pass','$role','$niveau','$td','$section')");
        $uid = $db->insert_id;
        
        if ($role === 'etudiant') {
            $cin    = $db->real_escape_string($b['cin'] ?? '');
            $tel    = $db->real_escape_string($b['telephone'] ?? '');
            $ddn    = $db->real_escape_string($b['date_naissance'] ?? '');
            $classe = $db->real_escape_string($b['classe'] ?? ($niveau.'-'.$td));
            $db->query("INSERT INTO etudiant_profile (id_user,id_national,telephone,date_naissance,classe) VALUES ($uid,'$cin','$tel','$ddn','$classe')");
        }
        
        // 🔔 Notify admins: new user registered
        notifyAdmins($db, 'new_user', 'Nouvel utilisateur inscrit', 
            "$prenom $nom s'est inscrit en tant que $role", 
            'admin.html#users');
        
        echo json_encode(['success'=>true]);
        break;

    // ── SALLES ────────────────────────────────────────────────────────────────
    case 'salles':
        $rows = $db->query("SELECT * FROM salle ORDER BY nom_salle");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── RESERVATIONS (current user) ───────────────────────────────────────────
    case 'reservations':
        requireLogin();
        $uid  = (int)getCurrentUserId();
        $rows = $db->query("SELECT r.*, s.nom_salle FROM reservation r JOIN salle s ON r.id_salle=s.id_salle WHERE r.id_user=$uid ORDER BY r.date DESC, r.heure_debut DESC");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── RESERVATIONS PAR DATE ─────────────────────────────────────────────────
    case 'reservations_par_date':
        $date = $db->real_escape_string($_GET['date'] ?? date('Y-m-d'));
        $rows = $db->query("SELECT * FROM reservation WHERE date='$date' AND statut='confirmee'");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── CHECK DISPONIBILITE ───────────────────────────────────────────────────
    case 'check_disponibilite':
        $salle = (int)($_GET['salle'] ?? 0);
        $date  = $db->real_escape_string($_GET['date'] ?? '');
        $debut = $db->real_escape_string($_GET['debut'] ?? '');
        $fin   = $db->real_escape_string($_GET['fin'] ?? '');
        $n = $db->query("SELECT id_reservation FROM reservation WHERE id_salle=$salle AND date='$date' AND statut='confirmee' AND heure_debut < '$fin' AND heure_fin > '$debut'")->num_rows;
        echo json_encode(['disponible' => $n === 0]);
        break;

    // ── RESERVER ─────────────────────────────────────────────────────────────
    case 'reserver':
        requireLogin();
        $b     = getBody();
        $uid   = (int)getCurrentUserId();
        $salle = (int)($b['salle'] ?? 0);
        $date  = $db->real_escape_string($b['date']  ?? '');
        $debut = $db->real_escape_string($b['debut'] ?? '');
        $fin   = $db->real_escape_string($b['fin']   ?? '');
        $motif = $db->real_escape_string($b['motif'] ?? '');

        if (!$salle || !$date || !$debut || !$fin) {
            echo json_encode(['success'=>false,'error'=>'Champs manquants']); 
            break;
        }

        // Check availability
        $conflict = $db->query("SELECT id_reservation FROM reservation
            WHERE id_salle=$salle AND date='$date' AND statut='confirmee'
            AND heure_debut < '$fin' AND heure_fin > '$debut'")->num_rows;
        if ($conflict > 0) {
            echo json_encode(['success'=>false,'error'=>'Créneau déjà réservé']); 
            break;
        }

        // Insert reservation
        $ok = $db->query("INSERT INTO reservation (date,heure_debut,heure_fin,statut,id_user,id_salle,motif)
                    VALUES ('$date','$debut','$fin','confirmee',$uid,$salle,'$motif')");
        if (!$ok) {
            $db->query("INSERT INTO reservation (date,heure_debut,heure_fin,statut,id_user,id_salle)
                        VALUES ('$date','$debut','$fin','confirmee',$uid,$salle)");
        }
        $res_id = $db->insert_id;
        if (!$res_id) {
            echo json_encode(['success'=>false,'error'=>'Erreur DB: '.$db->error]); 
            break;
        }

        // Get details for notifications
        $salle_row = $db->query("SELECT nom_salle FROM salle WHERE id_salle=$salle")->fetch_assoc();
        $salle_name = $salle_row['nom_salle'] ?? "Salle #$salle";
        $user_row  = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$uid")->fetch_assoc();
        $user_name = $user_row ? trim($user_row['prenom'].' '.$user_row['nom']) : 'Un utilisateur';

        // 🔔 Notify the user (confirmation)
        createNotification($db, $uid, 'reservation', 'Réservation confirmée',
            "$salle_name – $date de $debut à $fin",
            "mes_reservations.html");

        // 🔔 Notify all admins (new reservation made)
        notifyAdmins($db, 'reservation', 'Nouvelle réservation',
            "$user_name a réservé $salle_name le $date de $debut à $fin",
            "admin.html");

        echo json_encode(['success'=>true, 'id_reservation'=>$res_id]);
        break;

    // ── ANNULER RESERVATION ───────────────────────────────────────────────────
    case 'annuler':
        requireLogin();
        $b   = getBody();
        $id  = (int)($b['id'] ?? 0);
        $uid = (int)getCurrentUserId();

        // Get reservation details BEFORE cancelling
        $res = $db->query("SELECT r.*, s.nom_salle, u.nom as user_nom, u.prenom as user_prenom 
                           FROM reservation r
                           JOIN salle s ON r.id_salle=s.id_salle
                           JOIN utilisateur u ON r.id_user=u.id_user
                           WHERE r.id_reservation=$id AND r.id_user=$uid")->fetch_assoc();

        $db->query("UPDATE reservation SET statut='annulee' WHERE id_reservation=$id AND id_user=$uid");

        if ($db->affected_rows > 0 && $res) {
            $user_name = trim($res['user_prenom'].' '.$res['user_nom']);
            
            // 🔔 Notify the user (cancellation confirmation)
            createNotification($db, $uid, 'cancelled', 'Réservation annulée',
                "Votre réservation de {$res['nom_salle']} le {$res['date']} a été annulée.",
                "mes_reservations.html");
            
            // 🔔 Notify admins (reservation cancelled)
            notifyAdmins($db, 'cancelled', 'Réservation annulée',
                "$user_name a annulé sa réservation de {$res['nom_salle']} le {$res['date']}",
                "admin.html");
        }

        echo json_encode(['success' => $db->affected_rows > 0]);
        break;

    // ── SIGNALER ──────────────────────────────────────────────────────────────
    case 'signaler':
        requireLogin();
        $uid   = (int)getCurrentUserId();
        $salle = (int)($_POST['salle'] ?? 0);
        $desc  = $db->real_escape_string($_POST['description'] ?? '');
        $cat   = $db->real_escape_string($_POST['categorie']   ?? 'AUTRE');

        if (!$salle || !$desc) {
            echo json_encode(['success'=>false,'error'=>'Champs manquants']); 
            break;
        }

        $db->query("INSERT INTO reclamation (description,date,categorie_ia,statut,id_user,id_salle)
                    VALUES ('$desc',CURDATE(),'$cat','en attente',$uid,$salle)");

        $rec_id = $db->insert_id;
        
        // Get details for notification
        $salle_name = $db->query("SELECT nom_salle FROM salle WHERE id_salle=$salle")->fetch_assoc()['nom_salle'] ?? "Salle #$salle";
        $user_row   = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$uid")->fetch_assoc();
        $user_name  = $user_row ? trim($user_row['prenom'].' '.$user_row['nom']) : 'Un utilisateur';

        // 🔔 Notify all admins (new report)
        notifyAdmins($db, 'signalement', 'Nouveau signalement',
            "$user_name – $salle_name : ".mb_substr($desc, 0, 60).(mb_strlen($desc)>60?'...':''),
            "admin.html");

        // 🔔 Notify the user (receipt confirmation)
        createNotification($db, $uid, 'confirmation', 'Signalement envoyé',
            "Votre signalement pour $salle_name a bien été reçu.",
            "signaler.html");

        echo json_encode(['success'=>true]);
        break;

    // ── MES RECLAMATIONS ──────────────────────────────────────────────────────
    case 'mes_reclamations':
        requireLogin();
        $uid  = (int)getCurrentUserId();
        $rows = $db->query("SELECT r.*, s.nom_salle FROM reclamation r LEFT JOIN salle s ON r.id_salle=s.id_salle WHERE r.id_user=$uid ORDER BY r.date DESC LIMIT 10");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── ALL RECLAMATIONS (admin) ──────────────────────────────────────────────
    case 'all_reclamations':
        requireLogin();
        $rows = $db->query("SELECT r.*, s.nom_salle, t.nom AS tech_nom, t.prenom AS tech_prenom FROM reclamation r LEFT JOIN salle s ON r.id_salle=s.id_salle LEFT JOIN utilisateur t ON r.id_technicien=t.id_user ORDER BY r.date DESC");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── RECLAMATIONS TECHNICIEN ───────────────────────────────────────────────
    case 'reclamations':
        requireLogin();
        $uid  = (int)getCurrentUserId();
        $rows = $db->query("SELECT r.*, s.nom_salle FROM reclamation r LEFT JOIN salle s ON r.id_salle=s.id_salle WHERE r.id_technicien=$uid AND r.statut IN ('en attente','en cours') ORDER BY r.date DESC");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── INTERVENTIONS TECHNICIEN (historique) ─────────────────────────────────
    case 'interventions':
        requireLogin();
        $uid  = (int)getCurrentUserId();
        $rows = $db->query("SELECT r.*, s.nom_salle FROM reclamation r LEFT JOIN salle s ON r.id_salle=s.id_salle WHERE r.id_technicien=$uid AND r.statut='resolue' ORDER BY r.date DESC");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── UPDATE RECLAMATION STATUS ─────────────────────────────────────────────
    case 'update_reclamation':
        requireLogin();
        $b      = getBody();
        $id     = (int)($b['id'] ?? 0);
        $statut = $db->real_escape_string($b['statut'] ?? '');

        // Fetch full details before update
        $current = $db->query("SELECT r.*, s.nom_salle, u.nom as reporter_nom, u.prenom as reporter_prenom, u.id_user as reporter_id
                               FROM reclamation r
                               JOIN salle s ON r.id_salle=s.id_salle
                               JOIN utilisateur u ON r.id_user=u.id_user
                               WHERE r.id_reclamation=$id")->fetch_assoc();

        $old_statut = $current['statut'] ?? '';
        
        $db->query("UPDATE reclamation SET statut='$statut' WHERE id_reclamation=$id");

        if ($statut === 'resolue' && $old_statut !== 'resolue' && $current) {
            $tech_id  = (int)getCurrentUserId();
            $tech_row = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$tech_id")->fetch_assoc();
            $tech_name = $tech_row ? trim($tech_row['prenom'].' '.$tech_row['nom']) : 'Un technicien';
            
            $reporter_id = $current['reporter_id'];
            $salle_name = $current['nom_salle'];

            // 🔔 Notify the user who filed the report (THE REPORTER)
            createNotification($db, $reporter_id, 'resolved', '✅ Problème résolu',
                "Votre signalement pour $salle_name a été résolu par $tech_name.",
                "signaler.html");

            // 🔔 Notify all admins
            notifyAdmins($db, 'resolved', 'Signalement résolu',
                "$tech_name a résolu le problème dans $salle_name.",
                "admin.html");
                
            // 🔔 Notify the technician (confirmation of completion)
            createNotification($db, $tech_id, 'resolved', 'Intervention terminée',
                "Vous avez résolu le problème dans $salle_name.",
                "tech.html");
        }
        
        // If status changed to "en cours" and wasn't already
        if ($statut === 'en cours' && $old_statut !== 'en cours' && $current) {
            $tech_id = (int)getCurrentUserId();
            $tech_row = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$tech_id")->fetch_assoc();
            $tech_name = $tech_row ? trim($tech_row['prenom'].' '.$tech_row['nom']) : 'Un technicien';
            
            // 🔔 Notify admins that work has started
            notifyAdmins($db, 'in_progress', 'Intervention démarrée',
                "$tech_name a commencé à travailler sur {$current['nom_salle']}.",
                "admin.html");
        }

        echo json_encode(['success' => $db->affected_rows >= 0]);
        break;

    // ── ASSIGNER TECHNICIEN ───────────────────────────────────────────────────
    case 'assigner':
        requireLogin();
        $b   = getBody();
        $rid = (int)($b['id_reclamation'] ?? 0);
        $tid = (int)($b['id_technicien']  ?? 0);

        // Get details before assignment
        $rec = $db->query("SELECT r.*, s.nom_salle, u.nom as reporter_nom, u.prenom as reporter_prenom, u.id_user as reporter_id
                           FROM reclamation r
                           JOIN salle s ON r.id_salle=s.id_salle
                           JOIN utilisateur u ON r.id_user=u.id_user
                           WHERE r.id_reclamation=$rid")->fetch_assoc();

        $db->query("UPDATE reclamation SET id_technicien=$tid, statut='en cours' WHERE id_reclamation=$rid");

        if ($rec) {
            $tech_row = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$tid")->fetch_assoc();
            $tech_name = $tech_row ? trim($tech_row['prenom'].' '.$tech_row['nom']) : 'Un technicien';
            
            $salle_name = $rec['nom_salle'];
            $reporter_id = $rec['reporter_id'];
            $cat_label = $rec['categorie_ia'];

            // 🔔 Notify the assigned technician (THE TECH)
            createNotification($db, $tid, 'assignment', 'Nouvelle tâche assignée',
                "$salle_name – $cat_label",
                "tech.html");
                
            // 🔔 Notify the reporter that a tech was assigned
            createNotification($db, $reporter_id, 'assignment', 'Technicien assigné',
                "Un technicien ($tech_name) a été assigné à votre signalement pour $salle_name.",
                "signaler.html");
                
            // 🔔 Notify admins
            notifyAdmins($db, 'assignment', 'Tâche assignée',
                "$tech_name assigné à {$rec['nom_salle']} pour résoudre le problème.",
                "admin.html");
        }

        echo json_encode(['success' => $db->affected_rows > 0]);
        break;

    // ── TECHNICIENS LIST ──────────────────────────────────────────────────────
    case 'techniciens':
        requireLogin();
        $rows = $db->query("SELECT u.id_user, u.nom, u.prenom, u.email, tp.disponible FROM utilisateur u LEFT JOIN technicien_profile tp ON u.id_user=tp.id_user WHERE u.role='technicien'");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── ETUDIANTS LIST ────────────────────────────────────────────────────────
    case 'etudiants':
        requireLogin();
        $rows = $db->query("SELECT u.id_user, u.nom, u.prenom, u.email, u.niveau, u.td, u.section, ep.classe FROM utilisateur u LEFT JOIN etudiant_profile ep ON u.id_user=ep.id_user WHERE u.role='etudiant' ORDER BY u.nom");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── UTILISATEURS LIST ─────────────────────────────────────────────────────
    case 'utilisateurs':
        requireLogin();
        $rows = $db->query("
            SELECT u.*,
                ep.id_national AS etudiant_id_national, ep.telephone AS etudiant_tel, ep.classe AS etudiant_classe,
                pp.id_national AS prof_id_national, pp.telephone AS prof_tel, pp.grade, pp.departement, pp.specialites,
                tp.id_national AS tech_id_national, tp.telephone AS tech_tel, tp.domaine, tp.specialites AS tech_specialites, tp.disponible
            FROM utilisateur u
            LEFT JOIN etudiant_profile   ep ON u.id_user=ep.id_user AND u.role='etudiant'
            LEFT JOIN prof_profile       pp ON u.id_user=pp.id_user AND u.role='prof'
            LEFT JOIN technicien_profile tp ON u.id_user=tp.id_user AND u.role='technicien'
            ORDER BY u.role, u.nom");
        $out = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode($out);
        break;

    // ── GET USER BY ID ────────────────────────────────────────────────────────
    case 'get_user':
        requireLogin();
        $id   = (int)($_GET['id'] ?? 0);
        $row  = $db->query("SELECT u.*, ep.id_national AS etudiant_id_national, ep.telephone AS etudiant_tel, ep.classe AS etudiant_classe, ep.date_naissance, ep.adresse, ep.id_national, pp.id_national AS prof_id_national, pp.telephone AS prof_tel, pp.grade, pp.departement, pp.specialites, pp.classes, tp.id_national AS tech_id_national, tp.telephone AS tech_tel, tp.domaine, tp.specialites AS tech_specialites, tp.disponible, tp.date_embauche FROM utilisateur u LEFT JOIN etudiant_profile ep ON u.id_user=ep.id_user LEFT JOIN prof_profile pp ON u.id_user=pp.id_user LEFT JOIN technicien_profile tp ON u.id_user=tp.id_user WHERE u.id_user=$id")->fetch_assoc();
        if ($row) echo json_encode(['success'=>true,'user'=>$row]);
        else echo json_encode(['success'=>false,'error'=>'Utilisateur introuvable']);
        break;

    // ── UPDATE USER ───────────────────────────────────────────────────────────
    case 'update_user':
        requireLogin();
        $b    = getBody();
        $id   = (int)($b['id_user'] ?? 0);
        $nom  = $db->real_escape_string($b['nom'] ?? '');
        $prenom= $db->real_escape_string($b['prenom'] ?? '');
        $email = $db->real_escape_string($b['email'] ?? '');
        $role  = $b['role'] ?? '';
        $db->query("UPDATE utilisateur SET nom='$nom', prenom='$prenom', email='$email' WHERE id_user=$id");
        $cin = $db->real_escape_string($b['id_national'] ?? '');
        $tel = $db->real_escape_string($b['telephone'] ?? '');
        if ($role === 'etudiant') {
            $niveau  = $db->real_escape_string($b['niveau'] ?? '');
            $td      = $db->real_escape_string($b['td'] ?? '');
            $section = $db->real_escape_string($b['section'] ?? '');
            $classe  = $db->real_escape_string($b['classe'] ?? '');
            $ddn     = $db->real_escape_string($b['date_naissance'] ?? '');
            $adr     = $db->real_escape_string($b['adresse'] ?? '');
            $db->query("UPDATE utilisateur SET niveau='$niveau', td='$td', section='$section' WHERE id_user=$id");
            $exists = $db->query("SELECT id_user FROM etudiant_profile WHERE id_user=$id")->num_rows > 0;
            if ($exists) $db->query("UPDATE etudiant_profile SET id_national='$cin', telephone='$tel', classe='$classe', date_naissance='$ddn', adresse='$adr' WHERE id_user=$id");
            else $db->query("INSERT INTO etudiant_profile (id_user,id_national,telephone,classe,date_naissance,adresse) VALUES ($id,'$cin','$tel','$classe','$ddn','$adr')");
        } elseif ($role === 'prof') {
            $grade  = $db->real_escape_string($b['grade'] ?? '');
            $dept   = $db->real_escape_string($b['departement'] ?? '');
            $specs  = $db->real_escape_string(json_encode($b['specialites'] ?? []));
            $cls    = $db->real_escape_string(json_encode($b['classes'] ?? []));
            $exists = $db->query("SELECT id_user FROM prof_profile WHERE id_user=$id")->num_rows > 0;
            if ($exists) $db->query("UPDATE prof_profile SET id_national='$cin', telephone='$tel', grade='$grade', departement='$dept', specialites='$specs', classes='$cls' WHERE id_user=$id");
            else $db->query("INSERT INTO prof_profile (id_user,id_national,telephone,grade,departement,specialites,classes) VALUES ($id,'$cin','$tel','$grade','$dept','$specs','$cls')");
        } elseif ($role === 'technicien') {
            $domaine = $db->real_escape_string($b['domaine'] ?? '');
            $specs   = $db->real_escape_string(json_encode($b['specialites'] ?? []));
            $dembauche = $db->real_escape_string($b['date_embauche'] ?? '');
            $dispo   = (int)($b['disponible'] ?? 1);
            $exists  = $db->query("SELECT id_user FROM technicien_profile WHERE id_user=$id")->num_rows > 0;
            if ($exists) $db->query("UPDATE technicien_profile SET id_national='$cin', telephone='$tel', domaine='$domaine', specialites='$specs', date_embauche='$dembauche', disponible=$dispo WHERE id_user=$id");
            else $db->query("INSERT INTO technicien_profile (id_user,id_national,telephone,domaine,specialites,date_embauche,disponible) VALUES ($id,'$cin','$tel','$domaine','$specs','$dembauche',$dispo)");
        }
        
        // 🔔 Notify the user that their profile was updated
        createNotification($db, $id, 'system', 'Profil mis à jour',
            'Vos informations ont été modifiées par un administrateur.',
            'dashboard.html');
            
        // 🔔 Notify admins
        $admin_id = getCurrentUserId();
        $admin_row = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$admin_id")->fetch_assoc();
        $admin_name = $admin_row ? trim($admin_row['prenom'].' '.$admin_row['nom']) : 'Un administrateur';
        
        notifyAdmins($db, 'system', 'Utilisateur modifié',
            "$admin_name a modifié le profil de $prenom $nom.",
            'admin.html#users');
        
        echo json_encode(['success'=>true]);
        break;

    // ── STATISTIQUES DYNAMIQUES ─────────────────────────────────────────────
    case 'statistiques_occupation':
        requireLogin();
        $days = [];
        $today = new DateTime();
        
        for ($i = 6; $i >= 0; $i--) {
            $date = clone $today;
            $date->modify("-$i days");
            $dateStr = $date->format('Y-m-d');
            $dayName = $date->format('D');
            
            $totalRes = $db->query("SELECT COUNT(*) c FROM reservation WHERE date='$dateStr' AND statut='confirmee'")->fetch_assoc()['c'];
            $totalSalles = $db->query("SELECT COUNT(*) c FROM salle")->fetch_assoc()['c'];
            $occupancyRate = $totalSalles > 0 ? min(100, round(($totalRes / $totalSalles) * 100)) : 0;
            
            $days[] = [
                'date' => $dateStr,
                'day' => $dayName,
                'full_day' => $date->format('d/m'),
                'reservations' => (int)$totalRes,
                'occupancy_rate' => $occupancyRate
            ];
        }
        echo json_encode($days);
        break;

    // ── STATISTIQUES PAR SALLE ────────────────────────────────────────────
    case 'statistiques_par_salle':
        requireLogin();
        $stats = [];
        $rows = $db->query("SELECT type_salle, COUNT(*) as count FROM salle GROUP BY type_salle");
        $totalSalles = 0;
        $salleTypes = [];
        while ($r = $rows->fetch_assoc()) {
            $salleTypes[$r['type_salle']] = (int)$r['count'];
            $totalSalles += $r['count'];
        }
        
        $today = date('Y-m-d');
        $rows = $db->query("
            SELECT s.type_salle, COUNT(*) as res_count 
            FROM reservation r 
            JOIN salle s ON r.id_salle = s.id_salle 
            WHERE r.date='$today' AND r.statut='confirmee'
            GROUP BY s.type_salle
        ");
        $resByType = [];
        while ($r = $rows->fetch_assoc()) {
            $resByType[$r['type_salle']] = (int)$r['res_count'];
        }
        
        foreach ($salleTypes as $type => $count) {
            $reservations = $resByType[$type] ?? 0;
            $stats[] = [
                'type' => $type,
                'total' => $count,
                'reservations_today' => $reservations,
                'occupancy_rate' => $count > 0 ? round(($reservations / $count) * 100) : 0
            ];
        }
        echo json_encode($stats);
        break;

    // ── DELETE USER ───────────────────────────────────────────────────────────
    case 'delete_user':
        requireLogin();
        $b  = getBody();
        $id = (int)($b['id'] ?? 0);
        
        // Get user details before deletion for notification
        $user_row = $db->query("SELECT nom, prenom, role FROM utilisateur WHERE id_user=$id")->fetch_assoc();
        $user_name = $user_row ? trim($user_row['prenom'].' '.$user_row['nom']) : 'Utilisateur';
        $user_role = $user_row['role'] ?? 'inconnu';
        
        $db->query("DELETE FROM utilisateur WHERE id_user=$id");
        
        if ($db->affected_rows > 0) {
            // 🔔 Notify admins about deletion
            $admin_id = getCurrentUserId();
            $admin_row = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$admin_id")->fetch_assoc();
            $admin_name = $admin_row ? trim($admin_row['prenom'].' '.$admin_row['nom']) : 'Un administrateur';
            
            notifyAdmins($db, 'system', 'Utilisateur supprimé',
                "$admin_name a supprimé $user_name ($user_role).",
                'admin.html#users');
        }
        
        echo json_encode(['success' => $db->affected_rows > 0]);
        break;

    // ── ADMIN STATS ───────────────────────────────────────────────────────────
    case 'admin_stats':
        requireLogin();
        $total_res = $db->query("SELECT COUNT(*) c FROM reservation WHERE statut='confirmee'")->fetch_assoc()['c'];
        $salles_dispo = $db->query("SELECT COUNT(*) c FROM salle WHERE etat='disponible'")->fetch_assoc()['c'];
        $sig_ouverts  = $db->query("SELECT COUNT(*) c FROM reclamation WHERE statut IN ('en attente','en cours')")->fetch_assoc()['c'];
        $total_salles = $db->query("SELECT COUNT(*) c FROM salle")->fetch_assoc()['c'];
        $taux = $total_salles > 0 ? round(($salles_dispo / $total_salles) * 100) : 0;
        echo json_encode(['total_reservations'=>$total_res, 'salles_disponibles'=>$salles_dispo, 'signalements_ouverts'=>$sig_ouverts, 'taux_occupation'=>$taux]);
        break;

    // ── USER STATS (signaler page) ────────────────────────────────────────────
    case 'user_stats':
        requireLogin();
        $uid = (int)getCurrentUserId();
        $this_month = $db->query("SELECT COUNT(*) c FROM reclamation WHERE id_user=$uid AND MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())")->fetch_assoc()['c'];
        $total      = $db->query("SELECT COUNT(*) c FROM reclamation WHERE id_user=$uid")->fetch_assoc()['c'];
        $resolved   = $db->query("SELECT COUNT(*) c FROM reclamation WHERE id_user=$uid AND statut='resolue'")->fetch_assoc()['c'];
        $rate       = $total > 0 ? round(($resolved / $total) * 100) : 0;
        echo json_encode(['signalements_this_month'=>$this_month, 'resolution_rate'=>$rate, 'avg_resolution_time'=>'2.5h']);
        break;

    // ── STATISTIQUES ─────────────────────────────────────────────────────────
    case 'statistiques':
        requireLogin();
        $ghost = $db->query("SELECT COUNT(*) c FROM reservation WHERE statut='fantome'")->fetch_assoc()['c'];
        $total_salles = $db->query("SELECT COUNT(*) c FROM salle")->fetch_assoc()['c'];
        $dispo_salles = $db->query("SELECT COUNT(*) c FROM salle WHERE etat='disponible'")->fetch_assoc()['c'];
        $occ_rate = $total_salles > 0 ? round(($dispo_salles / $total_salles) * 100) : 0;
        $active_sig = $db->query("SELECT COUNT(*) c FROM reclamation WHERE statut IN ('en attente','en cours')")->fetch_assoc()['c'];
        $sig_stats  = [];
        $rows = $db->query("SELECT categorie_ia AS type, COUNT(*) AS count FROM reclamation GROUP BY categorie_ia ORDER BY count DESC");
        while ($r = $rows->fetch_assoc()) $sig_stats[] = $r;
        $peak_hours = [];
        $rows = $db->query("SELECT HOUR(heure_debut) AS hour, COUNT(*) AS count FROM reservation GROUP BY HOUR(heure_debut) ORDER BY hour");
        while ($r = $rows->fetch_assoc()) $peak_hours[] = $r;
        echo json_encode(['ghostBookings'=>$ghost, 'occupationRate'=>$occ_rate, 'activeSignalements'=>$active_sig, 'signalementStats'=>$sig_stats, 'peakHours'=>$peak_hours]);
        break;

    // ── GET NOTIFICATIONS ───────────────────────────────────────────────────────
    case 'get_notifications':
        requireLogin();
        $uid = (int)getCurrentUserId();
        $res = $db->query("SELECT * FROM notification WHERE id_user=$uid ORDER BY created_at DESC LIMIT 50");
        $list = [];
        while($row = $res->fetch_assoc()) {
            $row['time_ago'] = timeAgo($row['created_at']);
            $list[] = $row;
        }
        echo json_encode(['success' => true, 'notifications' => $list]);
        break;

    case 'mark_notification_read':
        requireLogin();
        $body = getBody();
        $id = (int)($body['id'] ?? 0);
        $uid = (int)getCurrentUserId();
        $db->query("UPDATE notification SET is_read=1 WHERE id_notification=$id AND id_user=$uid");
        echo json_encode(['success' => true]);
        break;

    case 'get_tech_history':
        requireLogin();
        $uid = (int)getCurrentUserId();
        $res = $db->query("SELECT r.*, s.nom_salle 
                           FROM reclamation r 
                           JOIN salle s ON r.id_salle = s.id_salle 
                           WHERE r.id_technicien = $uid AND r.statut = 'resolue' 
                           ORDER BY r.date DESC");
        $data = [];
        while($row = $res->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    // ── MARK ALL READ ───────────────────────────────────────────────────────────
    case 'mark_all_notifications_read':
        requireLogin();
        $uid = (int)getCurrentUserId();
        $db->query("UPDATE notification SET is_read=1 WHERE id_user=$uid AND is_read=0");
        echo json_encode(['success' => true]);
        break;

    // ── GET UNREAD COUNT ────────────────────────────────────────────────────────
    case 'get_unread_count':
        requireLogin();
        $uid = (int)getCurrentUserId();
        $count = $db->query("SELECT COUNT(*) c FROM notification WHERE id_user=$uid AND is_read=0")->fetch_assoc()['c'];
        echo json_encode(['success' => true, 'count' => (int)$count]);
        break;

    // ── GET CLASSES HIERARCHY ─────────────────────────────────────────────────
    case 'get_classes':
        requireLogin();
        $rows = $db->query("SELECT * FROM classe ORDER BY FIELD(grade,'Licence','Master','Ingénierie','Cycle Prépa'), niveau, nom_classe");
        $out  = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode(['success' => true, 'classes' => $out]);
        break;

    // ── GET STUDENTS IN A CLASS ───────────────────────────────────────────────
    case 'get_classe_students':
        requireLogin();
        $id_classe = (int)($_GET['id_classe'] ?? 0);
        $date      = $db->real_escape_string($_GET['date'] ?? date('Y-m-d'));
        if (!$id_classe) { echo json_encode(['success'=>false,'error'=>'id_classe requis']); break; }

        $rows = $db->query("
            SELECT u.id_user, u.nom, u.prenom, u.email, u.niveau, u.td,
                   (SELECT COUNT(*) FROM presence p
                    WHERE p.user_id=u.id_user
                    AND DATE(p.event_time)='$date') as present
            FROM utilisateur u
            JOIN classe_etudiant ce ON ce.id_etudiant=u.id_user
            WHERE ce.id_classe=$id_classe
            ORDER BY u.nom, u.prenom");
        $out = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode(['success' => true, 'students' => $out]);
        break;

    // ── SAVE PRESENCE ─────────────────────────────────────────────────────────
    case 'save_presence':
        requireLogin();
        $b       = getBody();
        $date    = $db->real_escape_string($b['date'] ?? date('Y-m-d'));
        $records = $b['records'] ?? [];
        $saved   = 0;

        foreach ($records as $rec) {
            $uid     = (int)($rec['user_id'] ?? 0);
            $present = (int)($rec['present'] ?? 0);
            if (!$uid) continue;

            // Get any existing room_id from a reservation today
            $room_row = $db->query("SELECT id_salle FROM reservation WHERE id_user=$uid AND date='$date' AND statut='confirmee' LIMIT 1")->fetch_assoc();
            $room_id  = $room_row ? (int)$room_row['id_salle'] : 1;

            // Delete existing presence record for this user on this date
            $db->query("DELETE FROM presence WHERE user_id=$uid AND DATE(event_time)='$date'");

            if ($present) {
                $db->query("INSERT INTO presence (user_id, room_id, event_time) VALUES ($uid, $room_id, '$date 08:00:00')");
                $saved++;
            }
        }
        echo json_encode(['success' => true, 'saved' => $saved]);
        break;

    // ── PUBLISH NEWS ──────────────────────────────────────────────────────────
    case 'publish_news':
        requireLogin();
        $b       = getBody();
        $titre   = $db->real_escape_string($b['titre']   ?? '');
        $contenu = $db->real_escape_string($b['contenu'] ?? '');
        $cible   = $db->real_escape_string($b['cible']   ?? 'tous');
        $uid     = (int)getCurrentUserId();

        // Only admin can publish
        $role_check = $db->query("SELECT role FROM utilisateur WHERE id_user=$uid")->fetch_assoc();
        if (!$role_check || $role_check['role'] !== 'admin') {
            echo json_encode(['success'=>false,'error'=>'Non autorisé']); break;
        }

        if (!$titre || !$contenu) { echo json_encode(['success'=>false,'error'=>'Titre et contenu requis']); break; }

        $db->query("INSERT INTO news (titre, contenu, id_auteur, cible) VALUES ('$titre','$contenu',$uid,'$cible')");
        $news_id = $db->insert_id;

        // 🔔 Notify targeted users
        $where = '';
        if ($cible === 'etudiant')  $where = "WHERE role='etudiant'";
        elseif ($cible === 'prof')  $where = "WHERE role='prof'";
        elseif ($cible === 'tous' || $cible === 'all') $where = "WHERE role IN ('etudiant','prof')";

        if ($where) {
            $targets = $db->query("SELECT id_user FROM utilisateur $where");
            while ($t = $targets->fetch_assoc()) {
                createNotification($db, $t['id_user'], 'confirmation',
                    '📢 Nouvelle annonce: ' . substr($titre, 0, 60),
                    substr($contenu, 0, 120) . (strlen($contenu) > 120 ? '...' : ''),
                    'nouveautes.html');
            }
        }

        echo json_encode(['success' => true, 'id_news' => $news_id]);
        break;

    // ── GET NEWS ──────────────────────────────────────────────────────────────
    case 'get_news':
        requireLogin();
        $uid  = (int)getCurrentUserId();
        $role = $db->query("SELECT role FROM utilisateur WHERE id_user=$uid")->fetch_assoc()['role'] ?? 'etudiant';

        // Admins see all; others see news targeted to them or 'tous'/'all'
        if ($role === 'admin') {
            $where = '';
        } else {
            $where = "WHERE n.cible IN ('tous','all','$role')";
        }

        $rows = $db->query("
            SELECT n.*, u.nom as auteur_nom, u.prenom as auteur_prenom
            FROM news n
            JOIN utilisateur u ON n.id_auteur = u.id_user
            $where
            ORDER BY n.created_at DESC");
        $out = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode(['success' => true, 'news' => $out]);
        break;

    // ── DELETE NEWS ───────────────────────────────────────────────────────────
    case 'delete_news':
        requireLogin();
        $b  = getBody();
        $id = (int)($b['id'] ?? 0);
        $uid = (int)getCurrentUserId();
        $role_check = $db->query("SELECT role FROM utilisateur WHERE id_user=$uid")->fetch_assoc();
        if (!$role_check || $role_check['role'] !== 'admin') {
            echo json_encode(['success'=>false,'error'=>'Non autorisé']); break;
        }
        $db->query("DELETE FROM news WHERE id_news=$id");
        echo json_encode(['success' => $db->affected_rows > 0]);
        break;


    // ── GET ALL USERS (admin panel – card layout) ─────────────────────────────
    case 'get_users':
        requireLogin();
        $rows = $db->query("
            SELECT u.id_user, u.nom, u.prenom, u.email, u.role, u.niveau, u.td, u.section,
                   ep.classe AS etudiant_classe,
                   pp.grade, pp.departement,
                   tp.domaine, tp.disponible
            FROM utilisateur u
            LEFT JOIN etudiant_profile   ep ON u.id_user=ep.id_user AND u.role='etudiant'
            LEFT JOIN prof_profile       pp ON u.id_user=pp.id_user AND u.role='prof'
            LEFT JOIN technicien_profile tp ON u.id_user=tp.id_user AND u.role='technicien'
            ORDER BY u.role, u.nom, u.prenom");
        $out = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode(['success' => true, 'users' => $out]);
        break;

    // ── GET STUDENT PRESENCE HISTORY ─────────────────────────────────────────
    // Returns all presence records for a specific student (admin or self)
    case 'get_student_presence':
        requireLogin();
        $target_uid = (int)($_GET['user_id'] ?? 0);
        $date_filter = $db->real_escape_string($_GET['date'] ?? '');
        $current_uid = (int)getCurrentUserId();

        // Security: étudiant can only see their own records; admin/prof can see any
        $current_role = $db->query("SELECT role FROM utilisateur WHERE id_user=$current_uid")->fetch_assoc()['role'] ?? '';
        if ($current_role === 'etudiant' && $target_uid !== $current_uid) {
            echo json_encode(['success' => false, 'error' => 'Non autorisé']);
            break;
        }
        if (!$target_uid) $target_uid = $current_uid;

        $date_where = $date_filter ? "AND p.date_presence='$date_filter'" : '';

        $rows = $db->query("
            SELECT p.id_presence, p.date_presence, p.present,
                   c.nom_classe, c.specialite, c.grade, c.niveau,
                   u.nom AS prof_nom, u.prenom AS prof_prenom
            FROM presences p
            JOIN classe c ON p.id_classe = c.id_classe
            LEFT JOIN utilisateur u ON p.prof_id = u.id_user
            WHERE p.user_id = $target_uid
            $date_where
            ORDER BY p.date_presence DESC, c.nom_classe");
        $out = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode(['success' => true, 'records' => $out]);
        break;

    // ── GET STUDENTS IN CLASS + their presence for a date (updated) ───────────
    // Replaces the old get_classe_students that used the old presence table
    case 'get_classe_students':
        requireLogin();
        $id_classe = (int)($_GET['id_classe'] ?? 0);
        $date      = $db->real_escape_string($_GET['date'] ?? date('Y-m-d'));
        if (!$id_classe) { echo json_encode(['success'=>false,'error'=>'id_classe requis']); break; }

        $rows = $db->query("
            SELECT u.id_user, u.nom, u.prenom, u.email, u.niveau, u.td,
                   COALESCE(p.present, 0) AS present
            FROM utilisateur u
            JOIN classe_etudiant ce ON ce.id_etudiant = u.id_user
            LEFT JOIN presences p ON p.user_id = u.id_user
                                 AND p.id_classe = $id_classe
                                 AND p.date_presence = '$date'
            WHERE ce.id_classe = $id_classe
            ORDER BY u.nom, u.prenom");
        $out = [];
        while ($r = $rows->fetch_assoc()) $out[] = $r;
        echo json_encode(['success' => true, 'students' => $out]);
        break;

    // ── SAVE PRESENCE (updated – uses presences table with classe & prof) ─────
    case 'save_presence':
        requireLogin();
        $b        = getBody();
        $date     = $db->real_escape_string($b['date'] ?? date('Y-m-d'));
        $records  = $b['records'] ?? [];
        $prof_id  = (int)getCurrentUserId();
        $saved    = 0;
        $notified = [];   // avoid duplicate notifications

        foreach ($records as $rec) {
            $uid       = (int)($rec['user_id']   ?? 0);
            $id_classe = (int)($rec['id_classe'] ?? 0);
            $present   = (int)($rec['present']   ?? 0);
            if (!$uid || !$id_classe) continue;

            // Upsert into presences table
            $db->query("INSERT INTO presences (user_id, id_classe, date_presence, present, prof_id)
                        VALUES ($uid, $id_classe, '$date', $present, $prof_id)
                        ON DUPLICATE KEY UPDATE present=$present, prof_id=$prof_id, updated_at=NOW()");
            $saved++;

            // Notify student if marked absent (once per student per day)
            if (!$present && !in_array($uid, $notified)) {
                $notified[] = $uid;
                $prof_row = $db->query("SELECT nom, prenom FROM utilisateur WHERE id_user=$prof_id")->fetch_assoc();
                $prof_name = $prof_row ? trim($prof_row['prenom'].' '.$prof_row['nom']) : 'Votre professeur';
                $classe_row = $db->query("SELECT nom_classe FROM classe WHERE id_classe=$id_classe")->fetch_assoc();
                $classe_name = $classe_row['nom_classe'] ?? 'votre classe';
                createNotification($db, $uid, 'absence', '⚠️ Absence enregistrée',
                    "$prof_name vous a marqué absent(e) en $classe_name le $date.",
                    'presence.html');
            }
        }
        echo json_encode(['success' => true, 'saved' => $saved]);
        break;

    default:
        echo json_encode(['error' => 'Action inconnue: ' . $action]);
}

$db->close();
?>