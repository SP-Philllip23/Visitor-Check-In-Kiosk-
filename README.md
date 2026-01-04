# Visitor-Check-In-Kiosk-
Visitor Check-In Kiosk System

The Visitor Check-In Kiosk System is a full-stack web application developed to modernize and improve the traditional visitor registration process commonly used in offices, universities, and organizational environments. The system replaces manual sign-in logbooks with a centralized digital kiosk that records visitor information, generates QR-based visit identifiers, and enables secure verification and reporting.

This project demonstrates practical application of full-stack development concepts, including frontend–backend integration, RESTful API design, database persistence, and user interface structuring for real-world operational roles.

# Project Purpose and Motivation 
Project Purpose and Motivation

Many organizations continue to rely on handwritten visitor logs, which are inefficient, difficult to audit, and prone to data loss or inaccuracies. Manual processes also limit real-time visibility for security personnel and make historical analysis cumbersome.

The purpose of this project is to design and implement a structured visitor management system that improves operational efficiency, enhances security verification, and preserves accurate historical records. The system was designed with real-world constraints in mind, prioritizing usability, data integrity, and audit readiness.

System Overview

The application is divided into three primary interfaces: a visitor kiosk, a security dashboard, and an administrator panel. Each interface serves a specific role and communicates with a centralized backend API.

Visitors interact with the kiosk interface to complete a self-service check-in process. Upon successful submission, the system generates a unique QR token representing the visit. Security personnel use the security dashboard to verify visitors, monitor active visits, and perform check-out operations. Administrators manage host availability through the admin panel without deleting records, ensuring that historical visit data remains consistent.

Visitor Check-In Process

When a visitor arrives, they complete a digital form that collects essential visit information, including personal details, host selection, and visit purpose. Once the check-in is completed, the system records the visit in the database and generates a unique QR code associated with that visit.

This QR code serves as a secure visit identifier and can be displayed or copied for later verification. Hosts that have been disabled by administrators are automatically excluded from the kiosk interface, preventing invalid visit assignments.

Security Verification and Monitoring

The security dashboard provides real-time visibility into all active visits within the system. Security staff can verify visitors by entering a QR token manually or by uploading a QR image file, allowing verification even in environments where camera access is unavailable.

Once verified, the dashboard displays detailed visit information, including visitor identity, host details, visit purpose, and timestamps. Security personnel can perform check-out actions directly from the interface. The system enforces strict visit state transitions to prevent duplicate or invalid check-outs and clearly distinguishes between active and completed visits.

The dashboard also supports exporting visit records in CSV format, enabling reporting, auditing, and administrative review.

Host Administration

The administrator panel allows authorized users to add and manage hosts. Instead of deleting hosts, the system supports enabling and disabling host accounts. Disabled hosts remain visible to administrators but are excluded from the visitor kiosk.

This design ensures that historical visit records remain intact and traceable, supporting accountability and preventing data inconsistencies caused by record deletion.

Technical Implementation

The frontend of the application is built using React with Vite, providing a responsive and efficient user interface. The backend is implemented using Node.js and Express, exposing RESTful APIs to handle all system operations, including check-in, verification, administration, and reporting.

SQLite is used as the database solution to store visitor, host, and visit records in a lightweight yet reliable manner. QR code generation and verification logic is integrated into the system workflow, and CSV export functionality is implemented on the backend with appropriate response handling to ensure compatibility with spreadsheet software.

How to Run the Project

To start the backend server, navigate to the server directory, install dependencies, and run the server using Node.js. The backend service runs on port 3001 by default.

To start the frontend application, navigate to the client directory, install dependencies, and launch the development server using Vite. The frontend application runs on port 5173. Both services must be running simultaneously for the system to function correctly.

Challenges Faced During Development

Throughout development, several challenges were encountered that required iterative problem-solving and design refinement. One early challenge involved managing host records without compromising historical visit data. Initially, disabling a host removed them entirely from the system, which caused older visit records to lose their host references. This was resolved by introducing a host status mechanism that allows hosts to be enabled or disabled without deletion.

Another challenge involved maintaining synchronization between frontend state and backend data. After performing administrative actions such as adding or disabling hosts, the user interface did not immediately reflect updated data. This issue was addressed by implementing consistent data reloading and state refresh logic after each operation.

QR code verification also introduced complexity, particularly in handling visit states and ensuring that check-out operations were valid. Additional logic was implemented to prevent duplicate check-outs and to clearly distinguish between active and completed visits.

Camera-based QR scanning proved unreliable on some devices due to browser permissions and hardware limitations. To address this, an alternative QR verification method was implemented that allows security staff to upload QR image files, ensuring consistent functionality across devices.

Finally, implementing CSV export functionality required careful handling of response headers and file streaming to ensure compatibility with spreadsheet applications such as Microsoft Excel.

Lessons Learned

This project reinforced the importance of designing systems with real-world usage scenarios in mind. Managing data integrity without relying on deletion proved to be critical for maintaining accurate historical records. The experience also highlighted the value of separating concerns between frontend presentation and backend logic, resulting in a more maintainable and scalable system.

The project improved understanding of asynchronous operations, state management in frontend applications, and error handling across distributed system components. Additionally, implementing multiple verification methods demonstrated the importance of usability and accessibility when designing security-related features.

Overall, the development process strengthened practical skills in full-stack development, debugging, and system design, while emphasizing the need for thoughtful planning and iterative improvement.

Future Improvements

While the system fulfills its intended objectives, several enhancements could be implemented in future iterations. Authentication and role-based access control could be added to restrict access to administrative and security features. Visitor photo capture and host notification mechanisms could further enhance security and communication.

The system could also be extended to support cloud-based databases, user analytics, and deployment to a production environment. Additional reporting features, such as daily or weekly visitor statistics, could provide deeper operational insights.

Conclusion

The Visitor Check-In Kiosk System provides a practical and structured solution for managing visitor workflows in organizational environments. The project demonstrates applied knowledge of full-stack web development, system architecture, and real-world problem solving. It is suitable for academic submission, portfolio presentation, and further development into a production-ready application.

Author

Phillip
Final-Year Project
Asia-Pacific International University