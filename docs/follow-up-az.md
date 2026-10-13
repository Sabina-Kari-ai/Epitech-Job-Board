# JobBoard: follow-up üçün qısa izah

## Layihəni belə təqdim et

“Bu layihə iş elanlarına baxmaq və işə müraciət etmək üçündür. Namizəd və şirkət üçün ayrı qeydiyyat var. Namizəd profilini, CV-sini, müraciətlərini və iş alertlərini idarə edir. Admin elanları, şirkətləri, istifadəçiləri və müraciət statuslarını idarə edir. Frontend və PHP API eyni database ilə işləyir.”

## Əsas anlayışlar

Session: login-dən sonra server istifadəçini tanıyır. Brauzer cookie göndərir, server kimin sorğu etdiyini yoxlayır. Logout sessiyanı bitirir.

Role və account_type: role icazədir (candidate və ya admin). account_type hesab növüdür (candidate və ya company). Şirkət hesabına admin icazəsi verilmir.

PDO: PHP-nin MariaDB ilə əlaqə vasitəsidir. Prepared statement istifadəçinin yazdığı məlumatı SQL sorğusundan ayırır və SQL injection riskini azaldır.

Cədvəllər: companies şirkətləri, users hesabları, jobs elanları, applications müraciətləri saxlayır. jobs.company_id elanı şirkətə, applications.user_id müraciəti namizədə, applications.job_id müraciəti elana bağlayır.

API və Vite: brauzer fetch ilə /api/... ünvanına sorğu edir. PHP database-dən məlumat oxuyur və ya yazır, sonra JSON qaytarır. Vite proxy sorğunu PHP serverinə çatdırır.

GET oxuyur, POST yaradır, PUT/PATCH yeniləyir, DELETE silir. Jobs/companies yazma əməliyyatları və müraciət statusunun dəyişməsi yalnız admin üçündür. İcazə backend-də yoxlanılır.

Schema database quruluşudur; seed nümunə məlumatlarıdır. Migration köhnə quruluşu məlumatları silmədən yeniləyir. Yerli MariaDB məlumatları GitHub ilə avtomatik ötürülmür.

## Son əlavələr və düzəlişlər

Ana səhifədə 6 elan var. Métier, compétence, lieu, şəhər və CDI/CDD/Alternance/Stage/Intérim filtrləri birlikdə işləyir. Créer un compte daxil olmuş istifadəçiyə də ana səhifədə görünür.

Admin müraciətin telefonunu, mesajını, motivasiya məktubunu və əlavə olunmuş CV-ni görə bilir. CV keçidində admin və müraciətin sahibi yoxlanılır.

Elan formasına compétences, missions, profil recherché, avantages, temps de travail və date limite əlavə edildi. Bu sahələr database-də saxlanılır və redaktədə geri gəlir.

Eyni namizəd eyni elana ikinci dəfə müraciət edə bilmir. Eyni anda iki sorğu göndərilsə, yalnız biri saxlanılır. Son tarix keçibsə müraciət bloklanır.

Şifrə bərpası məktubu və uyğun yeni elan üçün bildiriş yaranır. Reset linki bir saat etibarlıdır və bir dəfə işləyir; token açıq API cavabında verilmir. Eyni elana uyğun bir neçə alert təkrar məktub yaratmır.


## Müəllimə göstərmə ardıcıllığı

1. http://127.0.0.1:5173/ aç. Elanları və filtrləri göstər; Réinitialiser ilə sıfırla.

2. Créer un compte aç: Je suis candidat və Je suis une entreprise formalarını göstər.

3. Namizəd hesabına daxil ol. Mon compte-da profil, CV və şifrə bölmələrini göstər.

4. Offres → Voir l’offre → Postuler. Mes candidatures-də nəticəni göstər. Eyni elana yenidən müraciət edəndə sistem bunu bloklayır.

5. Mes alertes-də açar söz, yer və kontrakt meyarı ilə alert yarat.

6. Logout et, admin hesabına daxil ol. Offres, Entreprises, Candidatures və Utilisateurs bölmələrini göstər. Müraciətin tam məlumatını aç və statusunu dəyiş.

7. Ajouter une offre formasında yeni sahələri göstər. Elan alert meyarına uyğun olarsa namizəd üçün bildiriş məktubu yaranır.

8. Admin → Emails (démo) → Lire. Lokal məktubları göstər. Şifrə bərpasını sınamaq üçün Mot de passe oublié səhifəsində demo email-i daxil et, sonra admin inbox-da yaranan reset məktubunu aç.

## Demo hesabları

Namizəd: candidate@jobboard.test | Candidate123!

Admin: admin@jobboard.test | Admin123!

Şirkət: entreprise@jobboard.test | Company123!

## Müəllim soruşsa

“Password necə saxlanılır?” Açıq mətnlə saxlanılmır. password_hash ilə hash yaradılır, login-də password_verify ilə yoxlanılır.

“Başqasının müraciətini görə bilərəm?” Namizəd yalnız sessiyasındakı user_id-yə bağlı müraciətləri görür. Admin bütün müraciətləri görə bilir.

“Şirkət qeydiyyatı necə işləyir?” Transaction içində şirkət və ona bağlı user yaradılır. Xəta olsa hər iki əməliyyat rollback edilir.

“Merge problemi nə idi?” Database adları və bəzi sahələr uyğun deyildi, partnyorun CSS-i də itmişdi. Adlar və sahələr uyğunlaşdırıldı, orijinal görünüş bərpa edildi. Köhnə məlumatlar saxlanıldı.

“Nə test edildi?” 23 PHP faylı syntax yoxlamasından keçdi. 13 səhifə build-ə daxil olur. 113 API/migration və 162 frontend/static yoxlaması keçdi. Müraciət göndərmə, status dəyişikliyi və adminin yeni sahələri brauzerdə yoxlanıldı.

## Email və database haqqında dəqiq məlumat

SMTP hesabı hələ yoxdur. Emails (démo) məktubları layihənin daxilində göstərir; xarici email göndərilmir.

Yeni database üçün database/job-board-demo.sql import edilir. Mövcud quraşdırmada yeni email cədvəli üçün database/migrate-completion.sql var. Bu kompüterdə aktiv demo database test_epitech_job_board-dır; orijinal epitech_job_board qorunub.

Kod və izahlar PR #4-dədir: https://github.com/Sabina-Kari-ai/Epitech-Job-Board/pull/4. İşlək sayt hazırda lokaldır. Başqa kompüterdə README-dəki quraşdırma addımları yerinə yetirilməlidir.
