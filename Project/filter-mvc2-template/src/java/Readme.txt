Qui tắc đặt tên package
- <<tên sv viết tắt>>.<<tên package>>

Xây dựng filter để làm điều phối chính và chứa trong package filter
- Ví dụ: khanhkt.filter

Sử dụng context listener kết hợp context parameters
- Load và đọc file properties mapping resource (label=url_resource)
- Đưa thành attributes trong context scope
- Các resource và url phải được mapping từ attribute context trong các 
   resource như servlet và views

Các servlet chứa trong package controllers
-  Ví dụ: khanhkt.controller

Các code hỗ trợ chức năng đặt trong package utils
- Ví dụ: khanhkt.utils

DAO, DTO được mapping theo đúng chính sách tên bảng dưới DB và chứa trong package tên bảng viết thường
- Ví dụ: bảng trong DB có tên tbl_Student
- Tên package: khanhkt.tbl_Student
       - DAO : Tbl_Student_DAO
       - DTO : Tbl_Student_DTO
       - Các Errors theo qui tắt <<tên bảng>><tên chức năng>><<error>>
             : Tbl_StudentInsertError
             : Tbl_StudentUpdateError


Viết code phải xử lý lỗi cụ thể và ghi dùng log trong servlet, filter hay log4j
Tất cả các chức năng phải bắt lỗi khi cần thiết