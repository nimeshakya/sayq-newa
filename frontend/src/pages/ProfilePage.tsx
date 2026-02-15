import { useUserContext } from '../context/user.context';

const ProfilePage = () => {
    const { user } = useUserContext();

    const expertiseLevels = [
        'Beginner',
        'Elementary',
        'Intermediate',
        'Upper Intermediate',
        'Advanced',
        'Fluent',
    ];

    return (
        <div className='w-full flex-1 pt-20 bg-gray-100 flex items-center justify-center'>
            <div className='max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden min-w-1/2'>
                <div className='px-8 py-8 border-b-2 border-red-700'>
                    <h1 className='m-0 text-gray-800 text-3xl font-bold'>
                        Profile
                    </h1>
                </div>

                {user ? (
                    <div className='p-8 flex flex-col gap-8'>
                        {user.imageUrl && (
                            <div className='flex justify-center'>
                                <img
                                    src={user.imageUrl}
                                    alt={user.name}
                                    className='w-32 h-32 rounded-full object-cover border-4 border-red-700'
                                />
                            </div>
                        )}

                        <div className='flex flex-col gap-6'>
                            <div className='flex flex-col gap-1'>
                                <label className='text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                    Name
                                </label>
                                <p className='m-0 text-base text-gray-700'>
                                    {user.name}
                                </p>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                    Email
                                </label>
                                <p className='m-0 text-base text-gray-700'>
                                    {user.email}
                                </p>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                    Expertise Level
                                </label>
                                <p className='m-0 text-base text-gray-700'>
                                    {expertiseLevels[user.expertise_lvl] ||
                                        'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='p-10 text-center'>
                        <p className='m-0 text-gray-400 text-base'>
                            Please log in to view your profile
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
