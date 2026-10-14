# Lokal email demosu

Hazırda SMTP hesabı qoşulmayıb. Şifrə bərpası və uyğun iş elanı bildirişləri mail_outbox cədvəlində saxlanılır. Admin hesabı ilə daxil olub Administration → Emails (démo) → Lire seçərək məktubu oxuya bilərsiniz. Bu rejimdə heç bir xarici email göndərilmir.

Şifrə bərpası: logout edin, Mot de passe oublié səhifəsində demo email-i daxil edin. Sonra admin hesabına daxil olub Emails (démo)-da məktubun içindəki linki açın. Token public API cavabında göstərilmir və bir saatdan sonra etibarsız olur.

Elan bildirişi: namizəd hesabında alerte yaradın. Admin kimi kriteriyalara uyğun yeni elan yaradın. Namizəd üçün bir məktub yaranacaq. Eyni elanı yenidən save etmək və üst-üstə düşən bir neçə alerte təkrar məktub yaratmır. Aktiv olmayan və başqa meyarlara uyğun alertelərə məktub yaranmır.

Mövcud database üçün database/migrate-completion.sql tətbiq edin. Yeni demo quraşdırmasında job-board-demo.sql artıq bu cədvəli yaradır.

api/config/mail.local.example.php optional mail.local.php konfiqurasiyasını göstərir. app_url brauzerdə açılan sayt ünvanı olmalıdır. Gələcəkdə real mail transport qoşulanda PHP mail() və server email konfiqurasiyası tələb olunur; hazırkı demo xarici göndəriş kimi təqdim edilmir.
