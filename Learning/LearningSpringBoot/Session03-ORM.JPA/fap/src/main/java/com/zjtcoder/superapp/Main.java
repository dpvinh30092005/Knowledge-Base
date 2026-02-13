    package com.zjtcoder.superapp;

    import com.zjtcoder.superapp.entity.Lecturer;
    import com.zjtcoder.superapp.entity.Student;
    import jakarta.persistence.EntityManager;
    import jakarta.persistence.EntityManagerFactory;
    import jakarta.persistence.Persistence;

    import java.util.List;

    public class Main {
        // GỬI THÔNG SỐ CẤU HÌNH SERVER
        private static final EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.zjtcoder.superapp-PU");

        public static void main(String[] args) {
            try {
                //insertStudent();
                //getAllStudents();
                //insertLecturers();
                getAllLecturers();
                emf.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        public static void insertLecturers() {
            //Lôi ông sếp quản lý các Entity để tạo table
            Lecturer vinh = new Lecturer("PHƯỚC VINH", 1990, 20_000_000);
            Lecturer binh = new Lecturer("BÌNH LÊ", 1990, 20_000_000);
            EntityManager em = emf.createEntityManager();
            //Vì có thay đổi trên CSDL nên ta cần theo dõi chặt chẽ các câu lệnh
            //HOẶC TẤT CẢ HOẶC KHÔNG GÌ CẢ NGUYÊN LÍ ACID CỦA TRANSACTION
            //RỚT 1 TRONG 2 -> ROLLBACK
            em.getTransaction().begin();
            em.persist(vinh);
            em.persist(binh);
            em.getTransaction().commit();
            em.close();
        }

        public static void getAllLecturers() {
            EntityManager em = emf.createEntityManager();
            //LUÔN CẦN CÓ NGƯỜI QUẢN LÍ CÁC ENTITIES
            List <Lecturer> results = (em.createQuery("SELECT x FROM Lecturer x WHERE x.id = 3", Lecturer.class)).getResultList(); //.class sẽ giúp reflection hoặc mapping tới Class đó

//            for (Lecturer lecturer : results) {
//                System.out.println(lecturer);
//            }

            //BIỂU THỨC LAMBDA - LAMBDA EXPRESSION, DÍNH DÁNG CỰC KÌ CHẶT CHẼ VỚI STREAM API - CƠ CHẾ XỬ LÍ DỮ LIỆU Ở TRONG RAM
            // LAMBDA EXPRESSION LÀ HÀM ẨN DANH
            // DÍNH DÁNG ĐẾN KHÁI NIỆM LẬP TRÌNH HÀM - FUNCTION PROGRAMMING
            // HÀM LÀ 1 THAM SỐ ĐỂ TRUYỀN VÀO 1 HÀM KHÁC

            results.forEach(x ->
            {
                System.out.println(x);
//                for (int i = 1; i <= 100; i++) {
//                    System.out.println(i + " ");
//                }

            });

            em.close(); // PHẢI NHỚ !!!!!!!!!!!!!!!!!!!!!!!!!
        }

        //INSERT STUDENT
        public static void insertStudent() {

            //TẠO RA ! OBJECT DÙNG ĐỂ QUẢN LÝ CÁC ENTITY CLASS -> MAP NGANG SANG TABLE
            EntityManager em = emf.createEntityManager();
            //EntityManager lo CRUD trên 1 table
            //qua mấy hàm: persit(), find(), merge(), remove()
            //TOÀN CHƠI OBJECT< ĐẰNG SAU LÀ TABLE BỊ ẢNH HƯỞNG< SHOW SQL CHO MÌNH XEM KHI MÌNH ĐÃ CẤU HÌNH CHO HIBERNATE
            //chuẩn bị data Student - Object
            Student vinh = new Student("SE1", "Phước Vinh", 2005, 8.6);
            Student hanh = new Student("SE2", "Bích Hạnh", 2006, 8.7);
            Student cuong = new Student("SE3", "Cường Võ", 2006, 8.3);

            //Gọi sếp EntityManager giúp CRUD cho
            em.getTransaction().begin();// Bắt buộc get TRANSACTION khi có sự thay đổi trong database (ĐỂ ĐẢM BẢO TÍNH TOÀN VẸN CỦA DỮ LIỆU)
            em.persist(vinh);
            em.persist(hanh);
            em.persist(cuong);
            em.getTransaction().commit();//HOẶC CẢ 3 INSERT THÀNH CÔNG< HOẶC CHƯA BẠN NÀO ĐƯỢC INSERT
            //SELECT KHÔNG CẦN< VÌ NÓ KHÔNG LÀM THAY ĐỔI
            em.close();
            //emf.close();
        }

        //SELECT * STUDENT

        public static void getAllStudents() {
            EntityManager em = emf.createEntityManager();

            List<Student> result = em.createQuery("FROM Student ", Student.class).getResultList();
            // HẬU TRƯỜNG SELECT * FROM
            //QUERY NÀY CÚ PHÁP GẦN GIỐNG SQL< NHƯNG THEO STYLE OOP, CÓ OBJECT VÀ CÓ DẤU CHẤM, GỌI LÀ JPQL, HQL
            System.out.println("The list of students (3 records)");

            for (Student x : result) {
                System.out.println(x);
            }
            em.close();
            //emf.close();
        }
    }