# Follow-up üçün qısa izah

## Layihəni belə təqdim et

“Bu layihə iş elanlarına baxmaq, axtarış etmək və işə müraciət göndərmək üçündür. Namizəd və şirkət üçün iki ayrı qeydiyyat forması var. İstifadəçi daxil olduqda PHP session onu tanıyır. Müraciətlər database-də həmin istifadəçinin ID-si ilə saxlanılır. Admin isə elanları, şirkətləri, müraciət statuslarını və istifadəçi rollarını idarə edə bilir.”

## Ən vacib 7 anlayış

1. **Session:** Login-dən sonra server istifadəçinin ID-sini və icazələrini saxlayır. Brauzer session cookie göndərir, server kimin sorğu etdiyini bilir. Logout session-u silir.
2. **Role və account_type:** role icazədir: candidate və ya admin. account_type hesab növüdür: candidate və ya company. Şirkət hesabı avtomatik admin olmur.
3. **PDO:** PHP-nin database ilə danışması üçün istifadə olunur. Prepared statement sorğu ilə istifadəçinin yazdığı məlumatı ayırır və SQL injection riskini azaldır.
4. **Cədvəllərin əlaqəsi:** jobs.company_id elanı şirkətə bağlayır. users.company_id şirkət hesabını şirkətə bağlayır. applications.job_id müraciətin hansı elana, applications.user_id isə hansı namizədə aid olduğunu göstərir.
5. **API:** Frontend fetch ilə /api/... ünvanlarına sorğu göndərir. PHP database-dən oxuyur/yazır və JSON qaytarır. Vite proxy bu sorğuları PHP serverinə ötürür.
6. **GET/POST/PUT/DELETE:** GET oxuyur, POST yaradır, PUT/PATCH yeniləyir, DELETE silir. Jobs və companies yazma əməliyyatları yalnız admin üçündür.
7. **Axtarış:** Elanlar API-dən gəlir. JavaScript métier, compétence, lieu, kontrakt və şəhər meyarlarını birlikdə tətbiq edir. Compétence real skills sahəsinə baxır.

## Müəllim soruşsa

**Niyə role-a company əlavə etmədiniz?**
Çünki role icazəni, account_type isə hesab növünü göstərir. Bu ikisini ayırmaq mövcud admin məntiqini qoruyur.

**Namizəd başqa adamın müraciətlərini görə bilər?**
Xeyr. Server session-dakı user_id ilə nəticələri süzür. Frontend-də linki gizlətmək kifayət deyil; backend də icazəni yoxlayır.

**Şirkət qeydiyyatı necə işləyir?**
Transaction daxilində əvvəl şirkət, sonra həmin company_id ilə user yaradılır. Xəta olarsa hər ikisi rollback edilir.

**Password necə saxlanılır?**
Açıq mətn kimi saxlanılmır. password_hash ilə hash yaradılır, login-də password_verify ilə yoxlanılır.

**Admin rolunu dəyişsə, köhnə session nə olur?**
Qorunan sorğuda rol yenidən database-dən oxunur. Buna görə köhnə session artıq itirilmiş admin icazəsini saxlaya bilmir.

**Merge-dən sonra xəta niyə yarandı?**
Kod job_board adlı database axtarırdı, mövcud database isə epitech_job_board idi. Köhnə schema-da account_type, company_id və müraciətin bəzi sahələri də yox idi. Database adı uyğunlaşdırıldı və məlumatı silməyən migration hazırlandı.

**Nəyi yoxladınız?**
Bütün PHP fayllarına syntax yoxlaması, frontend build, ayrıca MariaDB-də API testləri və frontend filtrlərinin yoxlaması. Namizəd/şirkət/admin icazələri, müraciət ownership-i, CV, alerts və logout ayrıca yoxlanıldı.

## Demo ardıcıllığı

Ana səhifə → axtarış və filtrlər → iki qeydiyyat formu → namizəd login → profil/CV → Postuler → Mes candidatures → alerts → logout → admin tab-ları.

CV silinəndə əvvəldən göndərilmiş müraciətin CV faylı qalır. Köhnə məlumatlar silinməyib; bu kompüterdə uyğunlaşdırılmış ayrıca demo database-i işləyir.
