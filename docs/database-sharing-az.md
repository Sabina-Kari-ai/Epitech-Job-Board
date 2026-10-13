# Database-ni partnyorun kompüterində açmaq

Yerli MariaDB database-i GitHub ilə avtomatik ötürülmür. GitHub-da onun schema və demo məlumatlarını yaradan SQL faylları var.

## Yeni quraşdırma

PR #4 branch-indən database/job-board-demo.sql faylını götürün. MariaDB client-də database yaratmağa icazəsi olan hesabla daxil olun və bu faylı SOURCE əmri ilə import edin. Fayl epitech_job_board database-i, 8 cədvəl, 6 şirkət və 6 elan, 3 demo hesabı və demo müraciət/alerts məlumatlarını yaradır. Bu fayl boş/yeni database üçündür.

Windows-də repo Desktop-dadırsa:

    SOURCE C:/Users/sabin/Desktop/Epitech-Job-Board/database/job-board-demo.sql;

Partnyor öz kompüterində faylın yolunu istifadə etməlidir.

Sonra api/config/database.local.example.php-ni database.local.php kimi kopyalayın, öz MariaDB login/password məlumatlarını yazın və database adını epitech_job_board edin. Lokal password faylı GitHub-a göndərilmir.

## Köhnə database varsa

Mövcud database-i seçib database/migrate-integration.sql tətbiq edin. Bundan sonra database/add-demo-offers.sql mövcud 3 elana əlavə 3 elan artıraraq sayı 6 edir. Mövcud elan və müraciətlər silinmir; təkrar tətbiq həmin elanları çoxaltmır. Artıq 6 və ya daha çox elan varsa əlavə edilmir.

## MariaDB-də yoxlama

    USE epitech_job_board;
    SHOW TABLES;
    SELECT id, title, location, contract_type FROM jobs;
    SELECT COUNT(*) AS offers FROM jobs;

Saytı açmaq üçün npm ci, sonra ayrı terminallarda npm run api və npm run dev. Brauzerdə Vite ünvanını açın.

Bu kompüterdə orijinal epitech_job_board qorunub; aktiv demo kopyası test_epitech_job_board-dır. Yerli əlavə edilmiş elanları görmək üçün həmin database-i seçin:

    USE test_epitech_job_board;
    SELECT id, title, location, contract_type FROM jobs;

Paylaşılan SQL yalnız nümunə məlumatları saxlayır; şəxsi istifadəçilər, yerli password və reset tokenləri export edilməyib.
