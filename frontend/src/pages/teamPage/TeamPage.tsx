import "../../styles/team.style.scss";
import saurav from "../../assets/780340.jpg";
import aashish from "../../assets/780302.jpeg";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  contact: string;
  // bio: string;
  imageUrl?: string;
  link?: string;
}

/* Supervisor */
const supervisor: TeamMember = {
  id: 0,
  name: "Shree Ram Khaitu",
  role: "Project Supervisor",
  contact: "shreeramkhaitu@gmail.com",
  // bio: "Guiding the team with expertise, mentorship, and strategic direction.",
  // imageUrl: "/images/supervisor.jpg" // optional
};

/* Team Members */
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Saurav Dhoju",
    role: "780340",
    contact: "sauravdhoju12@gmail.com",
    // bio: "Passionate about building scalable applications and solving complex problems.",
    imageUrl: saurav
  },
  {
    id: 2,
    name: "Aashish Chakradhar",
    role: "780302",
    contact: "aashishchakradhar01@gmail.com",
    // bio: "Creating intuitive and beautiful user experiences is my top priority.",
    imageUrl: aashish
  },
  {
    id: 3,
    name: "Jeena Nakarmi",
    role: "780315",
    contact: "jeenakarmi@gmail.com",
    // bio: "Ensuring projects are delivered on time and meet the highest quality standards.",
    // imageUrl: "/images/780303.jpg"
  },
  {
    id: 4,
    name: "Nimesh Shakya",
    role: "780324",
    contact: "nimeshakyabtw@gmail.com",
    // bio: "Ensuring projects are delivered on time and meet the highest quality standards.",
  },
];

const TeamPage = () => {
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const renderAvatar = (member: TeamMember) => (
    <div className="member-avatar">
      {member.imageUrl ? (
        <img src={member.imageUrl} alt={member.name} />
      ) : (
        <span>{getInitials(member.name)}</span>
      )}
    </div>
  );

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <h1>Meet Our Team</h1>
        <p>
          The talented individuals behind NewaSayQ working together to bring you
          the best learning experience.
        </p>
      </div>

      {/* Supervisor */}
      <div className="supervisor-section">
        <h2>Supervisor</h2>

        <div className="team-member-card supervisor-card">
          {renderAvatar(supervisor)}
          <div className="member-info">
            <h3>{supervisor.name}</h3>
            <p className="role">{supervisor.role}</p>
            <p className="contact">{supervisor.contact}</p>
            {/* <p className="bio">{supervisor.bio}</p> */}
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="team-section">
        <h2>Team Members</h2>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <div key={member.id} className="team-member-card">
              {renderAvatar(member)}
              <div className="member-info">
                <h3>{member.name}</h3>
                <p className="role">{member.role}</p>
                <p className="contact">{member.contact}</p>
                {/* <p className="bio">{member.bio}</p> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
